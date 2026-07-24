const schemaId = Utils.getQueryParam("id");

const schema = Storage.getSchema(schemaId);

// if (!schema) {
//     // Utils.toast("Schema not found.");
//     location.href = "schemas.html";
//     // return;
// }

if (!Storage.schemaExists(schemaId)) {
    location.href = "schemas.html";
}

schemaName.value = schema.name;
schemaDescription.value = schema.description;

loadSchema(schema.schema);


saveBtn.addEventListener("click", () => {

    const errors = validateEntireSchema();

    if (errors.length) {
        renderAndValidate();
        return;
    }

    const existing = Storage.getSchemas().find(
        s => s.id !== schemaId && s.name.toLowerCase() === schemaName.value.trim().toLowerCase()
    );

    if (existing) {
        Utils.toast("A schema with this name already exists.");
        return;
    }

    Storage.updateSchema(schemaId, {
        name: schemaName.value.trim(),
        description: schemaDescription.value.trim(),
        schema: schemaJson,
        updated_at: Date.now()
    });

    // Utils.toast("Schema updated.");

    window.location.href = "schemas.html";

});