/*
|--------------------------------------------------------------------------
| Zendix Table Helper
|--------------------------------------------------------------------------
| Handles all utility functions to generate and build job extracted data table
|--------------------------------------------------------------------------
*/

const TableUtils = (() => {

    const PRIMITIVES = ['string', 'number', 'boolean'];

    function isPrimitive(value) {
        return (
            value === null ||
            PRIMITIVES.includes(typeof value)
        );
    }

    function flatten(
        value,
        {
            prefix = "",
            depth = 0,
            maxDepth = 2
        } = {}
    ) {
        const flat = {};

        // 1. Primitive
        if (isPrimitive(value)) {
            flat[prefix] = value;
            return flat;
        }

        // 2. Depth limit reached
        if (depth >= maxDepth) {
            flat[prefix + "_json"] = JSON.stringify(value);
            return flat;
        }

        // 3. Object
        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            for (const [key, val] of Object.entries(value)) {
                const newPrefix = prefix
                    ? `${prefix}.${key}`
                    : key;

                Object.assign(
                    flat,
                    flatten(val, {
                        prefix: newPrefix,
                        depth: depth + 1,
                        maxDepth
                    })
                );
            }

            return flat;
        }

        // 4. Array
        if (Array.isArray(value)) {
            flat[prefix + "_json"] = JSON.stringify(value);
            return flat;
        }

        // 5. Fallback
        flat[prefix] = String(value);

        return flat;
    }


    function isArrayOfObjects(value) {
        return (
            Array.isArray(value) &&
            value.every(item => item && typeof item === "object" && !Array.isArray(item))
        );
    }

    function namespaceDict(data, prefix) {
        const out = {};

        for (const [key, value] of Object.entries(data)) {
            out[`${prefix}.${key}`] = value;
        }

        return out;
    }

    function removeTopLevelKey(obj, key) {
        const copy = { ...obj };
        delete copy[key];
        return copy;
    }

    function flattenChain(
        context,
        current,
        chain,
        depth = 0
    ) {
        const key = chain[depth];

        if (!current || typeof current !== "object" || Array.isArray(current)) {
            return [];
        }

        const nextValue = current[key];

        // Missing
        if (nextValue === undefined || nextValue === null) {
            return [];
        }

        // -----------------------------
        // ARRAY CASE
        // -----------------------------
        if (Array.isArray(nextValue)) {

            if (nextValue.length === 0) {
                return [];
            }

            if (!isArrayOfObjects(nextValue)) {
                return [];
            }

            const rows = [];

            for (const item of nextValue) {

                const merged = {
                    ...context,
                    ...namespaceDict(item, key)
                };

                if (depth === chain.length - 1) {
                    rows.push(merged);
                } else {
                    rows.push(
                        ...flattenChain(
                            merged,
                            item,
                            chain,
                            depth + 1
                        )
                    );
                }
            }

            return rows;
        }

        // -----------------------------
        // OBJECT CASE
        // -----------------------------
        if (
            nextValue &&
            typeof nextValue === "object" &&
            !Array.isArray(nextValue)
        ) {

            const merged = {
                ...context,
                ...namespaceDict(nextValue, key)
            };

            return flattenChain(
                merged,
                nextValue,
                chain,
                depth + 1
            );
        }

        return [];
    }

    function buildRowsFromDocument(
        document,
        rowSource = null
    ) {

        if (!rowSource || rowSource === "document") {
            return [document];
        }

        const chain = rowSource.split(".");

        const rootKey = chain[0];

        const baseContext = removeTopLevelKey(
            document,
            rootKey
        );

        return flattenChain(
            baseContext,
            document,
            chain,
            0
        );
    }


    function discoverSchema(
        rows,
        maxDepth = 2
    ) {
        const columns = [];
        const seen = new Set();

        for (const row of rows) {
            const flat = flatten(row, {
                maxDepth
            });

            for (const key of Object.keys(flat)) {
                if (!seen.has(key)) {
                    seen.add(key);
                    columns.push(key);
                }
            }
        }

        return columns;
    }


    function projectRows(
        rows,
        columns,
        maxDepth = 2
    ) {
        const table = [];

        for (const row of rows) {
            const flat = flatten(row, {
                maxDepth
            });

            const projected = {};

            for (const column of columns) {
                projected[column] = flat[column];
            }

            table.push(projected);
        }

        return table;
    }


    function applyColumnVisibility(
        columns,
        visibleColumns
    ) {
        const visibleSet = new Set(visibleColumns);

        return columns.filter(col => visibleSet.has(col));
    }


    function paginateTable(
        table,
        page = 1,
        pageSize = 50
    ) {
        const total = table.length;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        return {
            rows: table.slice(start, end),
            totalRows: total
        };
    }


    function discoverArrayPaths(obj, prefix = "", maxDepth = 5, depth = 0) {
        const paths = [];

        if (depth > maxDepth) {
            return paths;
        }

        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;

                paths.push(
                    ...discoverArrayPaths(
                        value,
                        path,
                        maxDepth,
                        depth + 1
                    )
                );
            }
        }

        else if (Array.isArray(obj)) {
            if (
                obj.length &&
                obj.every(item => item && typeof item === "object" && !Array.isArray(item))
            ) {
                paths.push(prefix);

                // Continue searching inside the first object
                paths.push(
                    ...discoverArrayPaths(
                        obj[0],
                        prefix,
                        maxDepth,
                        depth + 1
                    )
                );
            }
        }

        return paths;
    }


    function filterRowSources(paths, maxLevels = 2) {
        return paths.filter(path => {
            return path.split(".").length <= maxLevels;
        });
    }


    // ==================================================
    // Public API
    // ==================================================

    return {
        
        flatten,

        buildRowsFromDocument,
        
        discoverSchema,
        
        projectRows,
        
        paginateTable,
        
        applyColumnVisibility,
        
        discoverArrayPaths,
        
        filterRowSources

    };

})();