saveBtn.addEventListener("click", () => {

    const errors = validateEntireSchema();

    if (errors.length) {
        renderAndValidate();
        return;
    }

    const existing = Storage.getSchemas().find(
        s => s.name.toLowerCase() === schemaName.value.trim().toLowerCase()
    );

    if (existing) {
        Utils.toast("A schema with this name already exists.");
        return;
    }

    Storage.saveSchema({
        id: Utils.uuid(),
        name: schemaName.value.trim(),
        description: schemaDescription.value.trim(),
        schema: schemaJson,
        created_at: Date.now(),
        updated_at: Date.now()
    });

    // Utils.toast("Schema created.");

    window.location.href = "schemas.html";

});