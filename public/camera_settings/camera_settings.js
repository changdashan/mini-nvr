(function () {
    const form = document.getElementById('cameraForm');
    const message = document.getElementById('formMessage');
    const description = document.getElementById('formDescription');
    const saveButton = document.getElementById('saveButton');
    const addButton = document.getElementById('addButton');
    const deleteButton = document.getElementById('deleteButton');
    const cancelAddButton = document.getElementById('cancelAddButton');
    const params = new URLSearchParams(window.location.search);
    const token = getStoredToken();
    let originalSiteId = params.get('site');
    let originalCameraId = params.get('camera');
    let mode = originalSiteId && originalCameraId ? 'update' : 'add';
    let originalCamera = null;

    function getStoredToken() {
        const auth = sessionStorage.getItem('auth');
        if (!auth) return '';
        try {
            return JSON.parse(auth).token || '';
        } catch (error) {
            return '';
        }
    }

    function defaults() {
        return {
            siteid: 'my_home',
            cameraid: '',
            label: '',
            videodevice: '',
            audiodevice: '',
            streamsource: 'video',
            cameraip: '',
            rtsp: '',
            rtspport: '554',
            rtspuser: '',
            rtsppwd: '',
            fps: 25,
            width: 1280,
            height: 720,
            b_v: '2M',
            audio: false,
            audioformat: 'mp2',
            nostats: '-nostats',
            player: 'jsmpeg',
            enabled: true
        };
    }

    function showMessage(text, kind) {
        message.textContent = text;
        message.className = kind || '';
    }

    function fillForm(camera) {
        for (const [name, value] of Object.entries(camera)) {
            const field = form.elements.namedItem(name);
            if (!field) continue;
            if (field.type === 'checkbox') {
                field.checked = value === true;
            } else {
                field.value = value == null ? '' : value;
            }
        }
        form.elements.namedItem('siteid').disabled = mode === 'update';
        form.elements.namedItem('cameraid').disabled = mode === 'update';
        saveButton.textContent = mode === 'update' ? 'Save changes' : 'Save new camera';
        addButton.hidden = mode === 'add';
        deleteButton.hidden = mode !== 'update';
        cancelAddButton.hidden = mode !== 'add' || !(originalSiteId && originalCameraId);
        description.textContent = mode === 'update'
            ? 'Edit the selected camera settings, or choose Add to create another camera.'
            : 'Enter settings for a new camera. Site ID defaults to my_home.';
    }

    function endpointUrl(extraParams) {
        const url = new URL('/camerasettings', window.location.origin);
        url.searchParams.set('token', token);
        for (const [key, value] of Object.entries(extraParams || {})) {
            url.searchParams.set(key, value);
        }
        return url.toString();
    }

    async function loadCamera() {
        if (!token) {
            showMessage('Administrator authentication is required.', 'error');
            form.hidden = true;
            return;
        }
        if (mode === 'add') {
            fillForm(defaults());
            return;
        }

        try {
            const response = await fetch(endpointUrl({
                siteid: originalSiteId,
                cameraid: originalCameraId
            }));
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
            originalCamera = result;
            fillForm(result);
        } catch (error) {
            showMessage(error.message, 'error');
        }
    }

    function readCamera() {
        const camera = {};
        for (const field of form.elements) {
            if (!field.name) continue;
            if (field.type === 'checkbox') {
                camera[field.name] = field.checked;
            } else if (['fps', 'width', 'height'].includes(field.name)) {
                camera[field.name] = Number(field.value);
            } else {
                camera[field.name] = field.value;
            }
        }
        return camera;
    }

    addButton.addEventListener('click', function () {
        mode = 'add';
        form.reset();
        fillForm(defaults());
        showMessage('', '');
    });

    cancelAddButton.addEventListener('click', function () {
        if (originalSiteId && originalCameraId) {
            mode = 'update';
            fillForm(originalCamera);
            showMessage('', '');
        }
    });

    deleteButton.addEventListener('click', async function () {
        if (mode !== 'update' || !originalCamera) return;
        if (!window.confirm(`Delete camera "${originalCamera.label || originalCamera.cameraid}"?`)) return;

        try {
            const response = await fetch(endpointUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    siteid: originalSiteId,
                    cameraid: originalCameraId
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);

            originalCamera = null;
            originalSiteId = null;
            originalCameraId = null;
            params.delete('site');
            params.delete('camera');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
            mode = 'add';
            form.reset();
            fillForm(defaults());
            showMessage('Camera deleted.', 'success');

            if (window.parent !== window && typeof window.parent.refreshCameraList === 'function') {
                try {
                    await window.parent.refreshCameraList(null, null);
                } catch (refreshError) {
                    showMessage(`Camera deleted, but the camera list could not be refreshed: ${refreshError.message}`, 'error');
                }
            }
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        showMessage('Saving camera settings...', '');

        const payload = {
            action: mode,
            camera: readCamera()
        };
        if (mode === 'update') {
            payload.siteid = originalSiteId;
            payload.cameraid = originalCameraId;
        }

        try {
            const response = await fetch(endpointUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
            originalCamera = result.camera;
            params.set('site', result.camera.siteid);
            params.set('camera', result.camera.cameraid);
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
            originalSiteId = result.camera.siteid;
            originalCameraId = result.camera.cameraid;
            mode = 'update';
            fillForm(result.camera);
            showMessage('Camera settings saved and reloaded by the server.', 'success');
            if (window.parent !== window && typeof window.parent.refreshCameraList === 'function') {
                try {
                    await window.parent.refreshCameraList(result.camera.siteid, result.camera.cameraid);
                } catch (refreshError) {
                    showMessage(`Settings saved, but the camera list could not be refreshed: ${refreshError.message}`, 'error');
                }
            }
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });

    loadCamera();
})();
