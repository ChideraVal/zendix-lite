const disabled_status = "";
let schemaJson = "";



/* ================== Utilities ================== */
function uid(p = 'id') { return p + "_" + Math.random().toString(36).slice(2, 9); }
function qs(sel, el = document) { return el.querySelector(sel); }
function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }


/* ================== DOM refs ================== */
const rootContainer = document.getElementById('fieldsContainer');
// const formjsonPreview = document.getElementById('formjsonPreview');
const treePreview = document.getElementById('treePreview');
const validationErrors = document.getElementById('validationErrors');
const saveBtn = document.getElementById('saveBtn');
const pasteSchema = document.getElementById('pasteSchema');
const schemaDescription = document.getElementById('schemaDescription');


/* ================== Field element factory ================== */
function createFieldElement(isNested = false) {
    const id = uid('f');
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = isNested ? 'nested-field-card' : 'field-card';
    wrapper.innerHTML = `
    <label class="label">Field name</label>
    <input class="fname" type="text" placeholder="field_name" oninput="renderAndValidate()" ${disabled_status} />

    <label class="label">Field type</label>
    <select class="ftype" onchange="onTypeChange('${id}')" ${disabled_status}>
      <option value="string">text</option>
      <option value="integer">number</option>
      <option value="number">decimal</option>
      <option value="boolean">true/false</option>
      <option value="object">group</option>
      <option value="array">list</option>
    </select>

    <div style="margin-top:8px;">
      <button class="small remove ghost" onclick="removeElement('${id}')" ${disabled_status}>Remove</button>
    </div>

    <div class="object-config" style="display:none; margin-top:10px;">
      <div class="section-label">Group fields</div>
      <div class="object-fields"></div>
      <div style="margin-top:8px;">
        <button class="small" onclick="addNestedField('${id}'); return false;" ${disabled_status}>+ Add group field</button>
      </div>
    </div>

    <div class="array-config" style="display:none; margin-top:10px;">
      <label class="label">List item type</label>
      <select class="arrayItemType" onchange="onArrayItemTypeChange('${id}')" ${disabled_status}>
        <option value="string">text</option>
        <option value="integer">number</option>
        <option value="number">decimal</option>
        <option value="boolean">true/false</option>
        <option value="object">group</option>
      </select>

      <div class="array-object-config" style="display:none; margin-top:8px;">
        <div class="section-label">List item group fields</div>
        <div class="array-object-fields"></div>
        <div style="margin-top:8px;">
          <button class="small" onclick="addNestedArrayField('${id}'); return false;" ${disabled_status}>+ Add list item group field</button>
        </div>
      </div>
    </div>
  `;
    return wrapper;
}

/* ================== Add / Remove helpers ================== */
function addField() { rootContainer.appendChild(createFieldElement(false)); renderAndValidate(); }
function removeElement(id) { const el = document.getElementById(id); if (el) el.remove(); renderAndValidate(); }
function addNestedField(parentId) { const parent = document.getElementById(parentId); parent.querySelector('.object-fields').appendChild(createFieldElement(true)); renderAndValidate(); }
function addNestedArrayField(parentId) { const parent = document.getElementById(parentId); parent.querySelector('.array-object-fields').appendChild(createFieldElement(true)); renderAndValidate(); }

/* ================== Type change handlers ================== */
function onTypeChange(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const t = el.querySelector('.ftype').value;
    el.querySelector('.object-config').style.display = (t === 'object') ? 'block' : 'none';
    el.querySelector('.array-config').style.display = (t === 'array') ? 'block' : 'none';
    if (t === 'array') onArrayItemTypeChange(id);
    renderAndValidate();
}
function onArrayItemTypeChange(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const it = el.querySelector('.arrayItemType').value;
    el.querySelector('.array-object-config').style.display = (it === 'object') ? 'block' : 'none';
    renderAndValidate();
}

/* ================== Build typed JSON recursively ================== */
function buildTypedFromElement(fieldEl) {
    const name = (qs('.fname', fieldEl)?.value || '').trim();
    if (!name) return null;
    const type = qs('.ftype', fieldEl).value;

    if (type === 'object') {
        const props = {};
        qsa(':scope > .object-config > .object-fields > .nested-field-card', fieldEl).forEach(nf => {
            const child = buildTypedFromElement(nf);
            if (child) props[child.name] = child.value;
        });
        return { name, value: { type: 'object', properties: props } };
    }

    if (type === 'array') {
        const itemType = qs('.arrayItemType', fieldEl).value;
        if (itemType === 'object') {
            const arrProps = {};
            qsa(':scope > .array-config > .array-object-config > .array-object-fields > .nested-field-card', fieldEl).forEach(nf => {
                const child = buildTypedFromElement(nf);
                if (child) arrProps[child.name] = child.value;
            });
            return { name, value: { type: 'array', items: { type: 'object', properties: arrProps } } };
        } else {
            return { name, value: { type: 'array', items: (itemType === 'number' ? 'float' : itemType) } };
        }
    }

    return { name, value: (type === 'number' ? 'float' : type) };
}

/* ================== Validation ================== */
function validateElement(fieldEl, path) {
    const errs = [];
    const name = (qs('.fname', fieldEl)?.value || '').trim();
    const displayPath = path || 'root';

    if (!name) {
        errs.push(`${displayPath}: field name cannot be empty.`);
        fieldEl.classList.add('invalid');
        return errs;
    }
    fieldEl.classList.remove('invalid');
    const type = qs('.ftype', fieldEl).value;

    if (type === 'object') {
        const nested = qsa(':scope > .object-config > .object-fields > .nested-field-card', fieldEl);
        if (nested.length === 0) {
            errs.push(`${displayPath}.${name}: group must have at least one property.`);
            fieldEl.classList.add('invalid');
        } else {
            nested.forEach(nf => errs.push(...validateElement(nf, `${displayPath}.${name}`)));
        }
    } else if (type === 'array') {
        const itemType = qs('.arrayItemType', fieldEl).value;
        if (itemType === 'object') {
            const nested = qsa(':scope > .array-config > .array-object-config > .array-object-fields > .nested-field-card', fieldEl);
            if (nested.length === 0) {
                errs.push(`${displayPath}.${name}: list items of type group must define at least one property.`);
                fieldEl.classList.add('invalid');
            } else {
                nested.forEach(nf => errs.push(...validateElement(nf, `${displayPath}.${name}[]`)));
            }
        }
    }
    return errs;
}

function validateEntireSchema() {
    const errors = [];
    const schemaName = document.getElementById('schemaName').value.trim();
    if (!schemaName) errors.push('Schema name cannot be empty.');

    const topFields = qsa(':scope > .field-card', rootContainer);
    if (topFields.length === 0) errors.push('Schema must have at least one top-level field.');

    topFields.forEach(f => errors.push(...validateElement(f, 'root')));
    return errors.filter(Boolean);
}

/* ================== Render & Validate ================== */
function renderAndValidate() {
    // clear previous invalid flags
    qsa('.invalid').forEach(el => el.classList.remove('invalid'));

    // build typed JSON
    const typed = {};
    qsa(':scope > .field-card', rootContainer).forEach(f => {
        const r = buildTypedFromElement(f);
        if (r) typed[r.name] = r.value;
    });
    // jsonPreview.textContent = JSON.stringify(typed, null, 4);
    // formjsonPreview.value = JSON.stringify(typed, null, 4);
    // schemaJson = JSON.stringify(typed, null, 2);
    schemaJson = typed;

    // tree view
    treePreview.innerHTML = '';
    const ul = document.createElement('ul');
    for (const k in typed) ul.appendChild(buildTree(typed[k], k));
    treePreview.appendChild(ul);

    // validation
    const errs = validateEntireSchema();
    if (errs.length) {
        validationErrors.innerHTML = `<div class="errors"><b>Validation errors:</b><ul>${errs.map(e => `<li>${e}</li>`).join('')}</ul></div>`;
        saveBtn.disabled = true;
        saveBtn.classList.add('disabled');
    } else {
        validationErrors.innerHTML = '';
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
    }
}

/* ================== Tree builder ================== */
// function buildTree(node, name) {
//     const li = document.createElement('li');
//     if (typeof node === 'object' && !Array.isArray(node)) {
//         if (node.type === 'object') {
//             li.innerHTML = `<b>${name}</b> : object`;
//             const ul = document.createElement('ul');
//             for (const k in node.properties) ul.appendChild(buildTree(node.properties[k], k));
//             li.appendChild(ul);
//         } else if (node.type === 'array') {
//             li.innerHTML = `<b>${name}</b> : array`;
//             const ul = document.createElement('ul');
//             const items = node.items;
//             if (typeof items === 'object' && items.type === 'object') {
//                 for (const k in items.properties) ul.appendChild(buildTree(items.properties[k], k));
//             } else {
//                 const child = document.createElement('li');
//                 child.textContent = `items: ${items}`;
//                 ul.appendChild(child);
//             }
//             li.appendChild(ul);
//         } else {
//             li.textContent = `${name} : ${node}`;
//         }
//     } else {
//         li.textContent = `${name} : ${node}`;
//     }
//     return li;
// }


const TYPE_LABELS = {
    string: "text",
    integer: "number",
    float: "decimal",
    boolean: "true/false",
    object: "group",
    array: "list",
};


/* ============== Tree builder (for display) ============== */
function buildTree(node, name) {
    const li = document.createElement('li');

    // Primitive types
    if (typeof node === 'string') {
        li.innerHTML = `
            <span class="tree-name">${name}</span>
            <span class="tree-separator">:</span>
            <span class="tree-type">
                ${TYPE_LABELS[node] || node}
            </span>
        `;
        return li;
    }

    // Object / array structures
    if (typeof node === 'object' && !Array.isArray(node)) {

        // -----------------------------
        // Group/Object
        // -----------------------------
        if (node.type === 'object') {

            li.innerHTML = `
                <span class="tree-name">${name}</span>
                <span class="tree-separator">:</span>
                <span class="tree-type">
                    ${TYPE_LABELS.object}
                </span>
            `;

            const ul = document.createElement('ul');

            for (const k in node.properties) {
                ul.appendChild(buildTree(node.properties[k], k));
            }

            li.appendChild(ul);
        }

        // -----------------------------
        // List/Array
        // -----------------------------
        else if (node.type === 'array') {

            li.innerHTML = `
                <span class="tree-name">${name}</span>
                <span class="tree-separator">:</span>
                <span class="tree-type">
                    ${TYPE_LABELS.array}
                </span>
            `;

            const ul = document.createElement('ul');
            const items = node.items;

            // List of groups
            if (typeof items === 'object' && items.type === 'object') {

                const groupLi = document.createElement('li');

                groupLi.innerHTML = `
                    <span class="tree-name">list item</span>
                    <span class="tree-separator">:</span>
                    <span class="tree-type">
                        ${TYPE_LABELS.object}
                    </span>
                `;

                const groupUl = document.createElement('ul');

                for (const k in items.properties) {
                    groupUl.appendChild(buildTree(items.properties[k], k));
                }

                groupLi.appendChild(groupUl);
                ul.appendChild(groupLi);
            }

            // List of primitive types
            else {

                const child = document.createElement('li');

                child.innerHTML = `
                    <span class="tree-name">list item</span>
                    <span class="tree-separator">:</span>
                    <span class="tree-type">
                        ${TYPE_LABELS[items] || items}
                    </span>
                `;

                ul.appendChild(child);
            }

            li.appendChild(ul);
        }
    }

    return li;
}

/* ================== Load from textarea ================== */
// function clearPaste() { pasteSchema.value = ''; }
function loadSchema(schema) {
    if (!schema) return;

    loadTypedJSONIntoUI(schema);
}

/* ================== Fixed loader: loadTypedJSONIntoUI ================== */
/**
 * typed: object mapping fieldName -> definition
 * definition:
 *  - "string" | "integer" | "float" | "boolean"
 *  - { type: "object", properties: { ... } }
 *  - { type: "array", items: <primitive string or { type: "object", properties: {...} } > }
 */
function loadTypedJSONIntoUI(typed) {
    if (!typed || typeof typed !== 'object') {
        throw new Error('Typed JSON must be an object mapping field -> type/object/array');
    }

    // clear builder
    rootContainer.innerHTML = '';

    // Recursive populater: parentContainer is DOM element to append into.
    function populate(parentContainer, keyName, def) {
        const el = createFieldElement(parentContainer !== rootContainer);
        el.querySelector('.fname').value = keyName;

        function setPrimitiveTypeOnEl(t) {
            const mapped = (t === 'float' ? 'number' : t);
            if (['string', 'integer', 'number', 'boolean'].includes(mapped)) {
                el.querySelector('.ftype').value = mapped;
            } else {
                el.querySelector('.ftype').value = 'string';
            }
        }

        // primitive
        if (typeof def === 'string') {
            setPrimitiveTypeOnEl(def);
            parentContainer.appendChild(el);
            return;
        }

        // object schema
        if (def && typeof def === 'object' && def.type === 'object') {
            el.querySelector('.ftype').value = 'object';
            el.querySelector('.object-config').style.display = 'block';
            const props = def.properties || {};
            for (const childName of Object.keys(props)) {
                populate(el.querySelector('.object-fields'), childName, props[childName]);
            }
            parentContainer.appendChild(el);
            return;
        }

        // array schema
        if (def && typeof def === 'object' && def.type === 'array') {
            el.querySelector('.ftype').value = 'array';
            el.querySelector('.array-config').style.display = 'block';
            const items = def.items;

            if (typeof items === 'string') {
                el.querySelector('.arrayItemType').value = (items === 'float' ? 'number' : items);
                el.querySelector('.array-object-config').style.display = 'none';
                parentContainer.appendChild(el);
                return;
            }

            if (items && typeof items === 'object' && items.type === 'object') {
                el.querySelector('.arrayItemType').value = 'object';
                el.querySelector('.array-object-config').style.display = 'block';
                const props = items.properties || {};
                for (const childName of Object.keys(props)) {
                    populate(el.querySelector('.array-object-fields'), childName, props[childName]);
                }
                parentContainer.appendChild(el);
                return;
            }

            // fallback: items may be { type: 'number' } style or others
            if (items && typeof items === 'object' && typeof items.type === 'string') {
                const maybe = (items.type === 'float' ? 'number' : items.type);
                if (['string', 'integer', 'number', 'boolean'].includes(maybe)) {
                    el.querySelector('.arrayItemType').value = maybe;
                    el.querySelector('.array-object-config').style.display = 'none';
                    parentContainer.appendChild(el);
                    return;
                }
            }

            // default fallback: array of string
            el.querySelector('.arrayItemType').value = 'string';
            el.querySelector('.array-object-config').style.display = 'none';
            parentContainer.appendChild(el);
            return;
        }

        // def may be { type: 'number' } etc.
        if (def && typeof def === 'object' && typeof def.type === 'string') {
            const t = def.type === 'float' ? 'number' : def.type;
            if (['string', 'integer', 'number', 'boolean'].includes(t)) {
                el.querySelector('.ftype').value = t;
                parentContainer.appendChild(el);
                return;
            }
        }

        // fallback
        el.querySelector('.ftype').value = 'string';
        parentContainer.appendChild(el);
    }

    // populate top-level
    for (const keyName of Object.keys(typed)) {
        populate(rootContainer, keyName, typed[keyName]);
    }

    // re-run render & validate
    renderAndValidate();
}

/* ============== Misc helpers & init ============== */
function renderInitial() { renderAndValidate(); loadSchema(); }

/* ============== Clear ============== */
function clearAll() { rootContainer.innerHTML = ''; document.getElementById('schemaName').value = ''; renderAndValidate(); }

/* init */
renderInitial();