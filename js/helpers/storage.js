/*
|--------------------------------------------------------------------------
| Zendix Storage Helper
|--------------------------------------------------------------------------
| Handles all application persistence.
|
| localStorage
| - Access Code
| - Schemas
| - Jobs
| - Settings
|
| IndexedDB
| - Uploaded Files
|--------------------------------------------------------------------------
*/

const Storage = (() => {

    // ==================================================
    // Keys
    // ==================================================

    const KEYS = {

        ACCESS_CODE: "zendix_access_code",

        EMAIL: "zendix_email",

        SCHEMAS: "zendix_schemas",

        JOBS: "zendix_jobs",

        SETTINGS: "zendix_settings",

        PENDING_VERIFICATIONS: "zendix_pending_verifications"

    };

    // ==================================================
    // IndexedDB
    // ==================================================

    const DB_NAME = "zendix";
    const DB_VERSION = 1;
    const FILE_STORE = "files";

    let dbPromise = null;

    // ==================================================
    // Local Storage Helpers
    // ==================================================

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function read(key, defaultValue) {

        try {

            const value = localStorage.getItem(key);

            if (value === null) {
                return clone(defaultValue);
            }

            return JSON.parse(value);

        } catch {

            return clone(defaultValue);

        }

    }

    function write(key, value) {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    }

    // ==================================================
    // IndexedDB Helpers
    // ==================================================

    function openDatabase() {

        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise((resolve, reject) => {

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onupgradeneeded = () => {

                const db = request.result;

                if (!db.objectStoreNames.contains(FILE_STORE)) {

                    db.createObjectStore(FILE_STORE);

                }

            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

        return dbPromise;

    }

    async function transaction(storeName, mode = "readonly") {

        const db = await openDatabase();

        return db.transaction(
            storeName,
            mode
        ).objectStore(storeName);

    }

    async function idbGet(storeName, key) {

        const store = await transaction(storeName);

        return new Promise((resolve, reject) => {

            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

    }

    async function idbPut(storeName, key, value) {

        const store = await transaction(
            storeName,
            "readwrite"
        );

        return new Promise((resolve, reject) => {

            const request = store.put(
                value,
                key
            );

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

    }

    async function idbDelete(storeName, key) {

        const store = await transaction(
            storeName,
            "readwrite"
        );

        return new Promise((resolve, reject) => {

            const request = store.delete(key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

    }

    async function idbDeleteMany(storeName, keys) {

        for (const key of keys) {

            await idbDelete(
                storeName,
                key
            );

        }

    }

    async function idbGetAll(storeName) {

        const store = await transaction(storeName);

        return new Promise((resolve, reject) => {

            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

    }

    async function idbClear(storeName) {

        const store = await transaction(
            storeName,
            "readwrite"
        );

        return new Promise((resolve, reject) => {

            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };

        });

    }

    // ==================================================
    // File Helpers
    // ==================================================

    function generateBlobKey(jobId) {

        if (
            window.crypto &&
            crypto.randomUUID
        ) {

            return `job_${jobId}_${crypto.randomUUID()}`;

        }

        return `job_${jobId}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`;

    }

    async function saveFile(blobKey, file) {

        await idbPut(
            FILE_STORE,
            blobKey,
            {
                blob: file,
                name: file.name,
                size: file.size,
                type: file.type,
                createdAt: new Date().toISOString()
            }
        );

    }

    async function saveFiles(files, jobId) {

        const metadata = [];

        for (const file of files) {

            const blobKey = generateBlobKey(jobId);

            await saveFile(
                blobKey,
                file
            );

            metadata.push({

                blobKey,

                name: file.name,

                size: file.size,

                type: file.type

            });

        }

        return metadata;

    }

    async function getFile(blobKey) {

        const record = await idbGet(
            FILE_STORE,
            blobKey
        );

        return record
            ? record.blob
            : null;

    }

    async function deleteFile(blobKey) {

        await idbDelete(
            FILE_STORE,
            blobKey
        );

    }

    async function deleteFiles(blobKeys) {

        await idbDeleteMany(
            FILE_STORE,
            blobKeys
        );

    }

    async function getAllFiles() {

        const store = await transaction(FILE_STORE);

        return new Promise((resolve, reject) => {

            const request = store.openCursor();

            const files = [];

            request.onsuccess = event => {

                const cursor = event.target.result;

                if (!cursor) {

                    resolve(files);

                    return;

                }

                files.push({

                    blobKey: cursor.key,

                    ...cursor.value

                });

                cursor.continue();

            };

            request.onerror = () => {

                reject(request.error);

            };

        });

    }

    async function clearFiles() {

        await idbClear(FILE_STORE);

    }

    // ==================================================
    // Access Code
    // ==================================================

    function getAccessCode() {
        return localStorage.getItem(KEYS.ACCESS_CODE);
    }

    function setAccessCode(code) {
        localStorage.setItem(KEYS.ACCESS_CODE, code);
    }

    function removeAccessCode() {
        localStorage.removeItem(KEYS.ACCESS_CODE);
    }

    // ==================================================
    // Email Address
    // ==================================================

    function getEmail() {
        return localStorage.getItem(KEYS.EMAIL);
    }

    function setEmail(email) {
        localStorage.setItem(KEYS.EMAIL, email);
    }

    function removeEmail() {
        localStorage.removeItem(KEYS.EMAIL);
    }

    // ==================================================
    // Schemas
    // ==================================================

    function getSchemas() {
        return read(KEYS.SCHEMAS, []);
    }

    function getSchema(id) {

        return getSchemas().find(
            schema => schema.id === id
        ) || null;

    }

    function saveSchema(schema) {

        const schemas = getSchemas();

        schemas.push(clone(schema));

        write(
            KEYS.SCHEMAS,
            schemas
        );

        return schema;

    }

    function updateSchema(id, updates) {

        const schemas = getSchemas();

        const index = schemas.findIndex(
            schema => schema.id === id
        );

        if (index === -1)
            return null;

        schemas[index] = {

            ...schemas[index],

            ...clone(updates)

        };

        write(
            KEYS.SCHEMAS,
            schemas
        );

        return schemas[index];

    }

    function deleteSchema(id) {

        write(

            KEYS.SCHEMAS,

            getSchemas().filter(
                schema => schema.id !== id
            )

        );

    }

    function clearSchemas() {
        write(KEYS.SCHEMAS, []);
    }

    function schemaExists(id) {

        return getSchemas().some(
            schema => schema.id === id
        );

    }

    function filterSchemas(predicate) {

        return getSchemas().filter(
            predicate
        );

    }


    // ==================================================
    // Jobs
    // ==================================================

    function getJobs() {
        return read(KEYS.JOBS, []);
    }

    function getJob(id) {

        return getJobs().find(
            job => job.id === id
        ) || null;

    }

    async function saveJob(job) {

        const jobs = getJobs();

        const jobCopy = clone(job);

        // ------------------------------------------
        // Store uploaded files in IndexedDB
        // ------------------------------------------

        if (
            Array.isArray(job.files) &&
            job.files.length > 0
        ) {

            jobCopy.files = await saveFiles(
                job.files,
                job.id
            );

        } else {

            jobCopy.files = [];

        }

        jobs.push(jobCopy);

        write(
            KEYS.JOBS,
            jobs
        );

        return clone(jobCopy);

    }

    function updateJob(id, updates) {

        const jobs = getJobs();

        const index = jobs.findIndex(
            job => job.id === id
        );

        if (index === -1) {
            return null;
        }

        // Never overwrite stored files here.
        // File changes should only happen when
        // creating or deleting jobs.

        const {

            files,

            ...safeUpdates

        } = clone(updates);

        jobs[index] = {

            ...jobs[index],

            ...safeUpdates,

            updated_at: new Date().toISOString()

        };

        write(
            KEYS.JOBS,
            jobs
        );

        return clone(
            jobs[index]
        );

    }

    async function deleteJob(id) {

        const jobs = getJobs();

        const job = jobs.find(
            job => job.id === id
        );

        if (!job) {
            return;
        }

        // ------------------------------------------
        // Delete uploaded files
        // ------------------------------------------

        if (
            Array.isArray(job.files) &&
            job.files.length > 0
        ) {

            await deleteFiles(

                job.files.map(
                    file => file.blobKey
                )

            );

        }

        // ------------------------------------------
        // Delete metadata
        // ------------------------------------------

        write(

            KEYS.JOBS,

            jobs.filter(
                job => job.id !== id
            )

        );

    }

    async function clearJobs() {

        const jobs = getJobs();

        for (const job of jobs) {

            await deleteJob(job.id);

        }

    }

    function jobExists(id) {

        return getJobs().some(
            job => job.id === id
        );

    }

    function getPendingJobs() {

        return getJobs().filter(

            job => job.status === "pending"

        );

    }

    function filterJobs(predicate) {

        return getJobs().filter(
            predicate
        );

    }

    // ==================================================
    // Pending Payment Verifications
    // ==================================================

    function getPendingVerifications() {

        return read(
            KEYS.PENDING_VERIFICATIONS,
            []
        );

    }


    function getPendingVerification(txRef) {

        return getPendingVerifications().find(

            verification => verification.tx_ref === txRef

        ) || null;

    }

    function addPendingVerification(verification) {

        const verifications =
            getPendingVerifications();

        // Prevent duplicates
        const existingIndex =
            verifications.findIndex(

                item => item.tx_ref === verification.tx_ref

            );

        if (existingIndex !== -1) {

            verifications[existingIndex] = {

                ...verifications[existingIndex],

                ...clone(verification)

            };

        }

        else {

            verifications.push(

                clone(verification)

            );

        }

        write(

            KEYS.PENDING_VERIFICATIONS,

            verifications

        );

    }


    function removePendingVerification(txRef) {

        write(

            KEYS.PENDING_VERIFICATIONS,

            getPendingVerifications().filter(

                verification => verification.tx_ref !== txRef

            )

        );

    }


    function clearPendingVerifications() {

        write(

            KEYS.PENDING_VERIFICATIONS,

            []

        );

    }


    function hasPendingVerifications() {

        return getPendingVerifications().length > 0;

    }


    function pendingVerificationExists(txRef) {

        return getPendingVerifications().some(

            verification => verification.tx_ref === txRef

        );

    }

    // ==================================================
    // Settings
    // ==================================================

    function getSettings() {

        return read(
            KEYS.SETTINGS,
            {}
        );

    }

    function saveSettings(settings) {

        write(

            KEYS.SETTINGS,

            clone(settings)

        );

    }

    async function blobToBase64(blob) {

        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.onerror = () => reject(reader.error);

            reader.readAsDataURL(blob);

        });

    }

    async function base64ToFile(dataUrl, name, type) {

        const response = await fetch(dataUrl);

        const blob = await response.blob();

        return new File(
            [blob],
            name,
            {
                type
            }
        );

    }

    async function exportBackup() {

        const files = [];

        for (const file of await getAllFiles()) {

            files.push({

                ...file,

                blob: await blobToBase64(file.blob)

            });

        }

        return {

            version: 1,

            exported_at: new Date().toISOString(),

            access_code: getAccessCode(),

            email: getEmail(),

            pending_verifications: getPendingVerifications(),

            settings: getSettings(),

            schemas: getSchemas(),

            jobs: getJobs(),

            files

        };

    }

    async function importBackup(backup) {

        // ------------------------------------------
        // Validate backup
        // ------------------------------------------

        if (!backup || typeof backup !== "object") {
            throw new Error("Invalid backup file.");
        }

        if (backup.version !== 1) {
            throw new Error("Unsupported backup version.");
        }

        if (!Array.isArray(backup.pending_verifications)) {
            throw new Error("Backup is missing pending verifications.");
        }

        if (!Array.isArray(backup.schemas)) {
            throw new Error("Backup is missing schemas.");
        }

        if (!Array.isArray(backup.jobs)) {
            throw new Error("Backup is missing jobs.");
        }

        if (!Array.isArray(backup.files)) {
            throw new Error("Backup is missing files.");
        }

        // ------------------------------------------
        // Convert files first
        // (don't delete anything until we know every
        // file can be restored)
        // ------------------------------------------

        const restoredFiles = [];

        for (const file of backup.files) {

            restoredFiles.push({

                ...file,

                blob: await base64ToFile(
                    file.blob,
                    file.name,
                    file.type
                )

            });

        }

        // ------------------------------------------
        // Clear existing data
        // ------------------------------------------

        removeAccessCode();

        removeEmail();

        clearPendingVerifications();

        clearSchemas();

        write(KEYS.JOBS, []);

        await clearFiles();

        saveSettings({});

        // ------------------------------------------
        // Restore files
        // ------------------------------------------

        for (const file of restoredFiles) {

            await idbPut(
                FILE_STORE,
                file.blobKey,
                {
                    blob: file.blob,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    createdAt: file.createdAt
                }
            );

        }

        // ------------------------------------------
        // Restore localStorage
        // ------------------------------------------

        if (backup.access_code) {
            setAccessCode(backup.access_code);
        }

        if (backup.email) {
            setEmail(backup.email);
        }

        saveSettings(
            backup.settings || {}
        );

        write(
            KEYS.PENDING_VERIFICATIONS,
            backup.pending_verifications
        );

        write(
            KEYS.SCHEMAS,
            backup.schemas
        );

        write(
            KEYS.JOBS,
            backup.jobs
        );

        return true;

    }

    // ==================================================
    // Public API
    // ==================================================

    return {

        // -----------------------------
        // Access Code
        // -----------------------------

        getAccessCode,
        setAccessCode,
        removeAccessCode,

        // -----------------------------
        // Email Address
        // -----------------------------

        getEmail,
        setEmail,
        removeEmail,

        // -----------------------------
        // Schemas
        // -----------------------------

        getSchemas,
        getSchema,
        saveSchema,
        updateSchema,
        deleteSchema,
        clearSchemas,
        schemaExists,
        filterSchemas,

        // -----------------------------
        // Jobs
        // -----------------------------

        getJobs,
        getJob,
        saveJob,
        updateJob,
        deleteJob,
        clearJobs,
        jobExists,
        getPendingJobs,
        filterJobs,

        // -----------------------------
        // Files
        // -----------------------------

        saveFile,
        saveFiles,
        getFile,
        deleteFile,
        deleteFiles,
        getAllFiles,
        clearFiles,

        // -----------------------------
        // Settings
        // -----------------------------

        getSettings,
        saveSettings,

        // -----------------------------
        // Pending Payment Verifications
        // -----------------------------

        getPendingVerifications,
        getPendingVerification,
        addPendingVerification,
        removePendingVerification,
        clearPendingVerifications,
        hasPendingVerifications,
        pendingVerificationExists,

        // -----------------------------
        // Backup
        // -----------------------------

        exportBackup,
        importBackup

    };

})();