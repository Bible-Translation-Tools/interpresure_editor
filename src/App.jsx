// --- 1. CONFIGURATION AND INITIAL DATA ---
import React from "react";

// --- 0. CONFIGURATION & INDEXEDDB UTILITIES ---

const IDB_NAME = 'CSVEditorDB';
const IDB_VERSION = 2;
const IDB_STORE_NAME = 'csv_data_store';
const DATA_KEY = 'current_csv_data'; // The current table content (transient)
const SCHEMA_KEY = 'persistent_csv_schema'; // Headers, Enum options, and Column Widths (persistent)

// Constants for Resizing
const MIN_COL_WIDTH = 100;
const DEFAULT_COL_WIDTH = 150;

// Static list of columns that must be treated as Enums
const STATIC_ENUM_COLUMNS = [
    "IllocutionaryForce", "Modality", "Stance", "Evidentiality", "Veridicality",
    "EntailmentPattern", "InferenceType", "IsCancelled", "Code", "PresuppositionType",
    "ImplicatureType", "IsScalar", "ScaleType", "IsExhausted", "PredicationType",
    "Information_Structure"
];

// Fields that should use a boolean (TRUE/FALSE/N/A) select dropdown in the modal
const BOOLEAN_FIELDS = ["IsCancelled", "IsScalar", "IsExhausted"];

/**
 * Opens the IndexedDB database.
 */
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                db.createObjectStore(IDB_STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.errorCode);
            reject(event.target.error);
        };
    });
};

/**
 * Saves a generic object to IndexedDB under a specific key.
 */
const saveToDB = async (key, dataToSave) => {
    try {
        const db = await openDB();
        const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IDB_STORE_NAME);

        // Convert Sets to Arrays for storage compatibility when saving schema
        if (key === SCHEMA_KEY && dataToSave && dataToSave.enumColumns) {
            const serializableEnums = {};
            for (const col in dataToSave.enumColumns) {
                serializableEnums[col] = {
                    isEnum: dataToSave.enumColumns[col].isEnum,
                    options: Array.from(dataToSave.enumColumns[col].options)
                };
            }
            dataToSave = { ...dataToSave, enumColumns: serializableEnums };
        }

        const request = store.put(dataToSave, key);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = (event) => {
                console.error(`Save failed for ${key}:`, event.target.error);
                reject(event.target.error);
            };
        });

    } catch (error) {
        console.error(`Could not save data for ${key} to IndexedDB:`, error);
    }
};

/**
 * Loads a generic object from IndexedDB by key.
 */
const loadFromDB = async (key) => {
    try {
        const db = await openDB();
        const transaction = db.transaction([IDB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                let result = event.target.result;

                // Convert Arrays back to Sets for use in React state when loading schema
                if (key === SCHEMA_KEY && result && result.enumColumns) {
                    const deserializedEnums = {};
                    for (const col in result.enumColumns) {
                        deserializedEnums[col] = {
                            isEnum: result.enumColumns[col].isEnum,
                            options: new Set(result.enumColumns[col].options)
                        };
                    }
                    result = { ...result, enumColumns: deserializedEnums };
                }
                resolve(result);
            };
            request.onerror = (event) => {
                console.error(`Load failed for ${key}:`, event.target.error);
                reject(event.target.error);
            };
        });

    } catch (error) {
        console.error(`Could not load data for ${key} from IndexedDB:`, error);
        return null;
    }
};


// --- 1. DEFAULT CSV DATA ---
const RAW_CSV_DATA = `ID,Book,Chapter,Verse,TokenID,GreekText,IllocutionaryForce,Modality,Stance,Evidentiality,Face,Veridicality,EntailmentPattern,InferenceType,IsCancelled,Code,Prejacent,PresuppositionType,ImplicatureType,InvitedInference,IsScalar,ScaleType,Alternative,IsExhausted,PredicationType,Question-Under-Discussion,InferredProposition,Information_Structure,Notes,,,
,Philemon,1,1,"57001001-01, 57001001-02, 57001001-03, 57001001-04",ΠΑΥΛΟΣ ΔΕΣΜΙΟΣ ΧΡΙΣΤΟΥ ΙΗΣΟΥ,N/A,Realis,Identity,N/A,N/A,Veridical,N/A,Implicature,FALSE,DefiniteDescription,"Paul is in prison because of Jesus",N/A,Particularized Conversational,N/A,FALSE,N/A,N/A,N/A,"Appositive predication, Defining","Global implicit QUD: What should Philemon do about Onesimus?","Paul is like Onesimus because he also has a master.",,"Choice of description is marked. Paul is presequencing to prepare for a latter, potentially face-threatening act. Paul explicitly honors Philemon and implicitly positions him as aligned with Paul’s mission and values. Paul anticipates that Philemon will behave accordingly when asked (especially in v. 8–10ff). Affiliative presequencing: Paul’s identifier is that he is a slave of Jesus Christ, no other identifier. Jesus is a master to Paul, but he...",,,
,Philemon,1,12,"570010120010, 570010120020, 570010120030, 570010120040",ΟΝ ΗΓΑΠΗΜΕΝΕ,N/A,N/A,Attitudinal,N/A,N/A,N/A,N/A,N/A,FALSE,Interjection,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,"Paul is using an affective address: he is feeling a lack of love from his church in Rome.",N/A,N/A,"Paul is presequencing, trying to mitigate the face threat inherent in asking Philemon to do something. He emphasizes his deep affection for him. There is a sense of 'If you love me, then you will do this thing.'",,,
,Philemon,1,17,"570010170010, 570010170020, 570010170030, 570010170040",ΕΙ ΟΥΝ ΜΕ ΕΧΕΙΣ ΚΟΙΝΩΝΟΝ,N/A,Hypothetical,N/A,N/A,N/A,Veridical,N/A,N/A,FALSE,Conjunction,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,"QUD: Does Paul have the right to request this action?","Paul is appealing to Philemon's prior relationship/commitment to Paul to justify the request.",,"The conditional is of the 'If X then Y' type, where X is taken to be true. Paul is using the first part as a premise for the second part (v. 17b). This acts as a presequencing element.",,,
,Philemon,1,21,"570010210010, 570010210020, 570010210030, 570010210040, 570010210100, 570010210110, 570010210120010, 570010210130010, 570010210140010",ΠΕΠΟΙΘΩΣ ΤΗ ΥΠΑΚΟΗ ΣΟΥ ΕΓΡΑΨΑ ΣΟΙ ΕΙΔΩΣ ΟΤΙ ΚΑΙ ΥΠΕΡ Ο ΖΗΤΩ ΠΟΙΗΣΕΙΣ,N/A,Realis,Epistemic,Attitudinal,N/A,Veridical,N/A,N/A,FALSE,Verb,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"Attitude report is used as a hedge (Paul is not asking something unreasonable, given the character of Philemon). Character sequencing reaches a crescendo. Paul expects more than the baseline. Will Philemon live up to his reputation?",,,
`;

// --- 2. CSV UTILITIES (Pure Functions) ---

/**
 * Parses a CSV string into an array of objects.
 * Assigns a unique ID (__id) to each row.
 */
const parseCSV = (csv) => {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return { headers: [], data: [] };

    const headers = lines[0].split(',').map(h => h.trim()).filter(h => h !== ''); // Filter out empty headers from trailing commas
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = [];
        let cell = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cells.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                cell = '';
            } else {
                cell += char;
            }
        }
        cells.push(cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

        const rowObject = {};
        cells.forEach((value, index) => {
            if (headers[index]) {
                rowObject[headers[index]] = value;
            }
        });
        rowObject.__id = Date.now() + i + Math.random(); // Unique ID
        data.push(rowObject);
    }

    return { headers, data };
};

/**
 * Converts an array of objects back into a CSV string.
 */
const toCSV = (data, headers) => {
    const escapeValue = (value) => {
        if (value === null || value === undefined) return '';
        let str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [];
    csvRows.push(headers.map(escapeValue).join(','));

    data.forEach(row => {
        const values = headers.map(header => escapeValue(row[header]));
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};

/**
 * Generates initial enum structure from headers and data, focusing on STATIC_ENUM_COLUMNS
 * and persistent schema options.
 */
const initializeEnumColumns = (currentHeaders, currentData, existingSchema = {}) => {
    const newEnumColumns = {};
    const enumSet = new Set(STATIC_ENUM_COLUMNS);

    currentHeaders.forEach(header => {
        const isStaticEnum = enumSet.has(header);
        const isPersistedEnum = existingSchema[header]?.isEnum;

        // Determine if it should be an enum
        const shouldBeEnum = isStaticEnum || isPersistedEnum;

        if (shouldBeEnum) {
            let optionsSet = new Set();

            // 1. Load existing options from persisted schema if available
            if (existingSchema[header] && existingSchema[header].options) {
                optionsSet = existingSchema[header].options;
            }

            // 2. Add options from the current document data (useful if the doc is newly loaded)
            currentData.forEach(row => {
                const value = row[header];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    optionsSet.add(String(value).trim());
                }
            });

            newEnumColumns[header] = {
                isEnum: true,
                options: optionsSet
            };
        } else {
            // Default to non-enum (text input)
            newEnumColumns[header] = { isEnum: false, options: new Set() };
        }
    });

    return newEnumColumns;
};


// --- 3. REACT COMPONENTS & HOOKS ---
const { useState, useEffect, useCallback, useMemo } = React;

/**
 * Custom Modal Component
 */
const Modal = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-indigo-600 text-white p-4 flex justify-between items-center rounded-t-xl z-20">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-indigo-200 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};


// Component for rendering a single cell
const EditableCell = React.memo(({ rowId, colName, value, isEnum, enumOptions, handleEdit }) => {
    const colOptions = enumOptions[colName];
    // Check for long text based on content or if it's a known long text field (QUD, Notes)
    const isLongTextField = colName.includes('Question') || colName.includes('Notes');
    const isLongText = isLongTextField || (value && (value.length > 50 || value.includes('\n')));
    const rows = isLongText ? Math.max(2, Math.ceil((value?.length || 0) / 50)) : undefined;

    // Use onBlur for commit to history (less frequent updates)
    const handleBlur = (e) => handleEdit(rowId, colName, e.target.value, true); // true = commit

    // Use onChange to update the cell's value temporarily (no commit)
    const handleChange = (e) => handleEdit(rowId, colName, e.target.value, false); // false = no commit

    const inputClasses = "editable-cell p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 w-full text-sm";
    const selectClasses = "editable-select p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 w-full bg-white text-sm";

    if (isEnum && colOptions) {
        let currentOptions = Array.from(colOptions.options).sort();
        if (value && !colOptions.options.has(value)) {
            // Ensure the current value is always available in the dropdown
            currentOptions = [value, ...currentOptions];
        }

        return (
            <select
                className={selectClasses}
                value={value || ''}
                onChange={handleChange}
                onBlur={(e) => handleEdit(rowId, colName, e.target.value, true)} // Select blur commits
            >
                <option value="">(None)</option>
                {currentOptions.map((optionText, index) => (
                    <option key={index} value={optionText}>
                        {optionText}
                    </option>
                ))}
            </select>
        );
    }

    if (isLongText) {
        return (
            <textarea
                type="text"
                className={`${inputClasses} resize-y`}
                rows={rows}
                value={value || ''}
                onBlur={handleBlur}
                onChange={handleChange}
            />
        );
    }

    return (
        <input
            type="text"
            className={inputClasses}
            value={value || ''}
            onBlur={handleBlur}
            onChange={handleChange}
        />
    );
});


// Main Application Component
const App = () => {
    // Current state being displayed
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [enumColumns, setEnumColumns] = useState({});
    const [loadingMessage, setLoadingMessage] = useState('Loading...');

    // Column Resizing State
    const [colWidths, setColWidths] = useState({});
    const [resizing, setResizing] = useState(null); // { startX, startWidth, colName }

    // History state for undo/redo
    const [history, setHistory] = useState({ past: [], future: [] });

    // New/Edit Row Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFormData, setCurrentFormData] = useState({}); // Data currently in the modal form
    const [editingRowId, setEditingRowId] = useState(null); // ID of the row being edited (null for new row)

    // UI Message State
    const [message, setMessage] = useState(null);

    /**
     * Helper to show a temporary message.
     */
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    /**
     * Gets an initial, empty row object based on current headers.
     */
    const getInitialRowData = useCallback((currentHeaders) => {
        const data = {};
        currentHeaders.forEach(header => {
            if (BOOLEAN_FIELDS.includes(header)) {
                data[header] = 'FALSE';
            } else {
                data[header] = '';
            }
        });
        // Ensure it has a temporary ID for form tracking before save
        data.__id = Date.now() + Math.random();
        return data;
    }, []);

    // --- History Management ---

    /**
     * Commits the current state (data, headers, enums) to the history stack.
     */
    const commitState = useCallback((newData, newHeaders, newEnums) => {
        setHistory(prevHistory => {
            const newPast = [...prevHistory.past, { data: data, headers: headers, enumColumns: enumColumns }];
            // Limit history depth to prevent excessive memory use
            if (newPast.length > 50) newPast.shift();

            return {
                past: newPast,
                future: [], // Clear future on new commit
            };
        });
        setData(newData);
        setHeaders(newHeaders);
        setEnumColumns(newEnums);

        // Also save the schema since it might have changed (widths are saved separately)
        saveSchema(newHeaders, newEnums, colWidths);
    }, [data, headers, enumColumns, colWidths]);


    /**
     * Sets the state from a history object (undo/redo).
     */
    const setStateFromHistory = useCallback((historyState) => {
        setData(historyState.data);
        setHeaders(historyState.headers);
        setEnumColumns(historyState.enumColumns);

        // When restoring state, we keep the current column widths (UI preference)
        saveSchema(historyState.headers, historyState.enumColumns, colWidths);
    }, [colWidths]);

    const undo = useCallback(() => {
        if (history.past.length === 0) return;

        const newPast = [...history.past];
        const stateToUndo = newPast.pop();

        setHistory(prevHistory => ({
            past: newPast,
            future: [{ data, headers, enumColumns }, ...prevHistory.future]
        }));

        setStateFromHistory(stateToUndo);
    }, [history, data, headers, enumColumns, setStateFromHistory]);

    const redo = useCallback(() => {
        if (history.future.length === 0) return;

        const [stateToRedo, ...newFuture] = history.future;

        setHistory(prevHistory => ({
            past: [...prevHistory.past, { data, headers, enumColumns }],
            future: newFuture
        }));

        setStateFromHistory(stateToRedo);
    }, [history, data, headers, enumColumns, setStateFromHistory]);


    // --- IndexedDB Saves ---
    const saveDocumentData = useCallback(() => {
        saveToDB(DATA_KEY, { data, headers });
    }, [data, headers]);

    // Combined schema save (headers, enums, widths)
    const saveSchema = useCallback((currentHeaders, currentEnums, currentWidths) => {
        saveToDB(SCHEMA_KEY, {
            headers: currentHeaders,
            enumColumns: currentEnums,
            colWidths: currentWidths
        });
    }, []);

    // --- EFFECT 1: Initial Load ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMessage('Checking for saved schema and data...');

            // 1. Load persistent Schema (Headers, Enum Options, Widths)
            const savedSchema = await loadFromDB(SCHEMA_KEY);
            const persistentHeaders = savedSchema?.headers || [];
            const persistentEnums = savedSchema?.enumColumns || {};
            const initialColWidths = savedSchema?.colWidths || {};

            // 2. Load transient Document Data
            const savedData = await loadFromDB(DATA_KEY);
            let initialDataResult = { headers: [], data: [] };

            if (savedData && savedData.data && savedData.headers) {
                setLoadingMessage('Loading last saved document...');
                initialDataResult = savedData;
            } else {
                setLoadingMessage('No saved document found. Loading default CSV...');
                initialDataResult = parseCSV(RAW_CSV_DATA);
            }

            try {
                // Determine the final set of headers
                const fileOrSavedHeaders = initialDataResult.headers;
                const finalHeadersSet = new Set([...fileOrSavedHeaders, ...persistentHeaders]);
                const finalHeaders = Array.from(finalHeadersSet);

                // Initialize/re-initialize enums
                const finalEnums = initializeEnumColumns(finalHeaders, initialDataResult.data, persistentEnums);

                // Initialize/re-initialize widths
                const finalColWidths = finalHeaders.reduce((acc, header) => {
                    // Use saved width, or default if not saved
                    acc[header] = initialColWidths[header] || DEFAULT_COL_WIDTH;
                    return acc;
                }, {});

                // Ensure all rows have all headers
                const dataWithCompleteHeaders = initialDataResult.data.map((row, i) => {
                    const newRow = { ...row, __id: row.__id || Date.now() + i + Math.random() };
                    finalHeaders.forEach(h => {
                        if (newRow[h] === undefined) newRow[h] = '';
                    });
                    return newRow;
                });

                setHeaders(finalHeaders);
                setData(dataWithCompleteHeaders);
                setEnumColumns(finalEnums);
                setColWidths(finalColWidths);
                setLoadingMessage(null);

                // Set the initial state as the first item in the history (not committed, just current)
                setHistory({ past: [], future: [] });

                // Save the (potentially updated) schema on first load
                saveSchema(finalHeaders, finalEnums, finalColWidths);

            } catch (error) {
                console.error("Error processing data:", error);
                setLoadingMessage('Error processing data. Check console for details.');
            }
        };

        loadInitialData();
    }, [saveSchema]);


    // --- EFFECT 2: Auto-save Document Data (transient data) ---
    useEffect(() => {
        if (data.length > 0 && headers.length > 0 && loadingMessage === null) {
            const timeoutId = setTimeout(saveDocumentData, 500); // Debounce save
            return () => clearTimeout(timeoutId);
        }
    }, [data, saveDocumentData, headers, loadingMessage]);

    // --- EFFECT 3: Column Resizing Logic ---
    const startResize = useCallback((e, colName) => {
        // Prevent default to stop text selection during drag
        e.preventDefault();

        // Find the current width of the column from the DOM element (the TH)
        const th = e.currentTarget.parentElement;

        setResizing({
            startX: e.clientX,
            startWidth: th.offsetWidth,
            colName: colName
        });
    }, []);

    // Global listener setup/teardown for resizing
    useEffect(() => {
        if (!resizing) return;

        const doResize = (e) => {
            const delta = e.clientX - resizing.startX;
            let newWidth = resizing.startWidth + delta;

            // Enforce minimum width
            if (newWidth < MIN_COL_WIDTH) {
                newWidth = MIN_COL_WIDTH;
            }

            setColWidths(prevWidths => ({
                ...prevWidths,
                [resizing.colName]: newWidth
            }));
        };

        const stopResize = () => {
            setResizing(null);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);

        // Cleanup function for listeners
        return () => {
            window.removeEventListener('mousemove', doResize);
            window.removeEventListener('mouseup', stopResize);
        };
    }, [resizing]); // Only depend on resizing state

    // Persistence effect: Triggers schema save when resizing is done
    useEffect(() => {
        // Only run when resizing completes (goes from active to null) and we have data
        if (resizing === null && Object.keys(colWidths).length > 0) {
            // Use a short delay to ensure `colWidths` state is finalized from `doResize`
            const timeoutId = setTimeout(() => {
                saveSchema(headers, enumColumns, colWidths);
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [resizing, colWidths, headers, enumColumns, saveSchema]);


    // --- Core Handlers (Editing existing cells) ---

    const handleEdit = useCallback((rowId, colName, newValue, shouldCommit) => {
        const trimmedValue = newValue.trim();
        let schemaChanged = false;
        let newEnums = enumColumns;

        // 1. Update data locally
        const newData = data.map(row => {
            if (row.__id === rowId) {
                return { ...row, [colName]: trimmedValue };
            }
            return row;
        });

        // 2. Check if we need to update enum options
        if (enumColumns[colName]?.isEnum && trimmedValue !== '' && !enumColumns[colName].options.has(trimmedValue)) {
            newEnums = { ...enumColumns };
            const newOptions = new Set(newEnums[colName].options);
            newOptions.add(trimmedValue);
            newEnums[colName] = { ...newEnums[colName], options: newOptions };
            schemaChanged = true;
        }

        // 3. Update state (temporarily or commit)
        if (shouldCommit) {
            // Commit to history and update state
            commitState(newData, headers, newEnums);
        } else {
            // Just update state for immediate rendering (for non-blur events)
            setData(newData);
            if (schemaChanged) {
                setEnumColumns(newEnums);
            }
        }
    }, [data, headers, enumColumns, commitState]);

    const exportData = useCallback(() => {
        const csvContent = toCSV(data, headers);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const date = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `CSV_Annotations_exported_${date}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data, headers]);

    const handleFileLoad = useCallback(async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoadingMessage('Loading custom file...');
            e.target.value = null; // Reset input field to allow loading the same file again

            // 1. Load persistent schema first
            const savedSchema = await loadFromDB(SCHEMA_KEY);
            const persistentHeaders = savedSchema?.headers || [];
            const persistentEnums = savedSchema?.enumColumns || {};
            const persistentWidths = savedSchema?.colWidths || {};

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const result = parseCSV(event.target.result);

                    // Combine file headers with persistent custom headers
                    const newHeadersSet = new Set([...result.headers, ...persistentHeaders]);
                    const finalHeaders = Array.from(newHeadersSet);

                    // Re-initialize enums structure
                    const finalEnums = initializeEnumColumns(finalHeaders, result.data, persistentEnums);

                    // Re-initialize widths
                    const finalColWidths = finalHeaders.reduce((acc, header) => {
                        acc[header] = persistentWidths[header] || DEFAULT_COL_WIDTH;
                        return acc;
                    }, {});

                    // Ensure all rows have the full set of headers
                    const dataWithCompleteHeaders = result.data.map((row, i) => {
                        const newRow = { ...row, __id: i + 1 + Math.random() };
                        finalHeaders.forEach(h => {
                            if (newRow[h] === undefined) newRow[h] = '';
                        });
                        return newRow;
                    });

                    setColWidths(finalColWidths); // Update widths immediately
                    // Commit the new file load as a history action
                    commitState(dataWithCompleteHeaders, finalHeaders, finalEnums);
                    setLoadingMessage(null);

                } catch (error) {
                    setLoadingMessage('Error reading file. Check console for details.');
                    console.error('File Read Error:', error);
                }
            };
            reader.readAsText(file);
        }
    }, [commitState]);


    // --- Add/Remove Column Modal Logic (Existing logic retained) ---

    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [newColName, setNewColName] = useState('');
    const [isNewColEnum, setIsNewColEnum] = useState(false);
    const [newColOptionsText, setNewColOptionsText] = useState('');
    const [colToRemove, setColToRemove] = useState('');

    const openConfirmationModal = (action, columnName = '') => {
        setConfirmationAction(action);
        if (action === 'new_doc') {
            setConfirmationMessage(
                "Are you sure you want to start a new document? All current data will be cleared, but your custom schema (headers/options) will be kept. We recommend exporting your work first."
            );
            setNewColName('');
        } else if (action === 'add_col') {
            setConfirmationMessage('Define the properties for the new column:');
            setNewColName('');
            setIsNewColEnum(false);
            setNewColOptionsText('');
        } else if (action === 'remove_col') {
            setColToRemove(columnName);
            setConfirmationMessage(`WARNING: Are you sure you want to permanently remove the column '${columnName}'? All data in this column will be deleted. This action can be UNDONE.`);
        }
        setIsConfirmationModalOpen(true);
    };

    const confirmAction = useCallback(() => {
        setIsConfirmationModalOpen(false);

        if (confirmationAction === 'new_doc') {
            // Commit clearing current data
            commitState([], headers, enumColumns);
        } else if (confirmationAction === 'add_col') {
            const trimmedColName = newColName.trim();
            if (trimmedColName && !headers.includes(trimmedColName)) {

                const updatedHeaders = [...headers, trimmedColName];
                const updatedData = data.map(row => ({ ...row, [trimmedColName]: '' }));

                const newOptions = isNewColEnum
                    ? new Set(newColOptionsText.split('\n').map(line => line.trim()).filter(line => line !== ''))
                    : new Set();

                const updatedEnums = {
                    ...enumColumns,
                    [trimmedColName]: { isEnum: isNewColEnum, options: newOptions }
                };

                // Set default width for the new column
                setColWidths(prevWidths => ({
                    ...prevWidths,
                    [trimmedColName]: DEFAULT_COL_WIDTH
                }));

                // Commit adding column
                commitState(updatedData, updatedHeaders, updatedEnums);
            }
        } else if (confirmationAction === 'remove_col') {
            if (!colToRemove) return;

            const updatedHeaders = headers.filter(h => h !== colToRemove);

            const updatedData = data.map(row => {
                const { [colToRemove]: _, ...rest } = row;
                return rest;
            });

            const updatedEnums = { ...enumColumns };
            delete updatedEnums[colToRemove];

            // Remove width setting for the deleted column (will be persisted via saveSchema call in commitState)
            setColWidths(prevWidths => {
                const { [colToRemove]: _, ...rest } = prevWidths;
                return rest;
            });

            // Commit removing column
            commitState(updatedData, updatedHeaders, updatedEnums);
        }

        // Clear temp state
        setNewColName('');
        setIsNewColEnum(false);
        setNewColOptionsText('');
        setColToRemove('');
    }, [confirmationAction, newColName, isNewColEnum, newColOptionsText, colToRemove, headers, data, enumColumns, commitState]);

    // --- Option Management Modal Logic (Existing logic retained) ---
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [modalColumn, setModalColumn] = useState(null);
    const [modalOptionsText, setModalOptionsText] = useState('');

    const enumCols = useMemo(() => headers.filter(h => enumColumns[h]?.isEnum), [headers, enumColumns]);

    const openOptionModal = () => {
        if (enumCols.length === 0) {
            showMessage("No enum columns available to manage. Add a new enum column first.", "error");
            return;
        }
        const initialCol = enumCols[0];
        setModalColumn(initialCol);

        const optionsArray = Array.from(enumColumns[initialCol].options).sort();
        setModalOptionsText(optionsArray.join('\n'));
        setIsOptionModalOpen(true);
    };

    const handleColumnSelectChange = (e) => {
        const selectedCol = e.target.value;
        setModalColumn(selectedCol);
        const optionsArray = Array.from(enumColumns[selectedCol].options).sort();
        setModalOptionsText(optionsArray.join('\n'));
    };

    const saveOptions = () => {
        if (!modalColumn) return;

        const newOptionsArray = modalOptionsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        // Update global state, then let useEffect trigger the commit
        setEnumColumns(prevEnums => ({
            ...prevEnums,
            [modalColumn]: {
                ...prevEnums[modalColumn],
                options: new Set(newOptionsArray)
            }
        }));

        setIsOptionModalOpen(false);
    };

    // Helper to sync schema state after option management
    useEffect(() => {
        if (isOptionModalOpen === false && modalColumn !== null) {
            // After options modal closes, commit the change to history
            commitState(data, headers, enumColumns);
            setModalColumn(null); // Clear to prevent repeated saving
        }
    }, [isOptionModalOpen, modalColumn, data, headers, enumColumns, commitState]);


    // --- ROW MODAL LOGIC (ADD/EDIT) ---

    // Function to open the modal for adding a new row
    const openNewRowModal = () => {
        if (headers.length > 0) {
            setCurrentFormData(getInitialRowData(headers));
            setEditingRowId(null); // Explicitly set to null for 'Add' mode
            setIsModalOpen(true);
        } else {
            showMessage("Cannot add a row: Headers have not been loaded yet.", "error");
        }
    };

    // Function to open the modal for editing an existing row
    const handleRowDoubleClick = useCallback((rowId) => {
        const rowToEdit = data.find(row => row.__id === rowId);
        if (rowToEdit) {
            setCurrentFormData(rowToEdit);
            setEditingRowId(rowId); // Set the ID for 'Edit' mode
            setIsModalOpen(true);
        }
    }, [data]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingRowId(null);
    };

    const handleFormInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setCurrentFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Simple validation: check if 'GreekText' is filled
        if (!currentFormData.GreekText || currentFormData.GreekText.trim() === '') {
            showMessage("The 'GreekText' field is required.", "error");
            return;
        }

        let newData;
        let successMessage = '';

        // 1. Determine if we are ADDING or EDITING
        if (editingRowId) {
            // EDITING MODE
            newData = data.map(row => {
                if (row.__id === editingRowId) {
                    return currentFormData;
                }
                return row;
            });
            successMessage = `Row edited successfully!`;
        } else {
            // ADDING MODE
            // Ensure the new row has a stable unique ID before commit
            const newEntry = { ...currentFormData, __id: Date.now() + Math.random() };
            newData = [...data, newEntry];
            successMessage = `New row added successfully!`;
        }

        // 2. Check for new enum options (same logic as before)
        let newEnums = enumColumns;
        for (const colName of headers) {
            const value = currentFormData[colName];
            if (enumColumns[colName]?.isEnum && value !== '' && !enumColumns[colName].options.has(value)) {
                newEnums = { ...newEnums };
                const newOptions = new Set(newEnums[colName].options);
                newOptions.add(value);
                newEnums[colName] = { ...newEnums[colName], options: newOptions };
            }
        }

        // 3. Commit the new state to history
        commitState(newData, headers, newEnums);

        // 4. Close modal, reset form state, and show success
        handleModalClose();
        showMessage(successMessage, 'success');
    };

    const renderFormField = (header) => {
        const isEnum = enumColumns[header]?.isEnum;
        const isBoolean = BOOLEAN_FIELDS.includes(header);
        const inputId = `form-input-${header}`;

        const baseClasses = "mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150";

        // Determine if this should be a large textarea
        const isLongTextField = header.includes('Question') || header.includes('Notes') || header.includes('InferredProposition');

        return (
            <div key={header} className="p-2">
                <label htmlFor={inputId} className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                    {header}
                    {header === 'GreekText' && <span className="text-red-500 ml-1 font-bold">*</span>}
                    {isEnum && <span className="text-indigo-500 ml-1 text-xs font-normal">(Enum)</span>}
                </label>

                {isEnum ? (
                    <select
                        id={inputId}
                        name={header}
                        value={currentFormData[header] || ''}
                        onChange={handleFormInputChange}
                        className={baseClasses}
                    >
                        <option value="">(None)</option>
                        {Array.from(enumColumns[header].options).sort().map((optionText, index) => (
                            <option key={index} value={optionText}>
                                {optionText}
                            </option>
                        ))}
                    </select>
                ) : isBoolean ? (
                    <select
                        id={inputId}
                        name={header}
                        value={currentFormData[header] || 'FALSE'}
                        onChange={handleFormInputChange}
                        className={baseClasses}
                    >
                        <option value="TRUE">TRUE</option>
                        <option value="FALSE">FALSE</option>
                        <option value="N/A">N/A</option>
                    </select>
                ) : isLongTextField ? (
                    <textarea
                        id={inputId}
                        name={header}
                        value={currentFormData[header] || ''}
                        onChange={handleFormInputChange}
                        rows={isLongTextField ? 3 : 1}
                        className={`${baseClasses} resize-y bg-gray-50`}
                    />
                ) : (
                    <input
                        id={inputId}
                        type="text"
                        name={header}
                        value={currentFormData[header] || ''}
                        onChange={handleFormInputChange}
                        className={`${baseClasses} bg-gray-50`}
                    />
                )}
            </div>
        );
    };


    // --- Modal Markup (Combined for simplicity) ---
    const columnModificationModal = (
        <div className={isConfirmationModalOpen ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75" : "hidden"}>
            {/* Confirmation Modal Content (Add/Remove Column, New Doc) */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
                <h2 className="text-xl font-bold mb-4">
                    {confirmationAction === 'new_doc' && 'Confirm New Document'}
                    {confirmationAction === 'add_col' && 'Add New Column'}
                    {confirmationAction === 'remove_col' && 'Confirm Column Deletion'}
                </h2>
                <p className="text-gray-700 mb-4 font-medium">{confirmationMessage}</p>

                {/* Add Column Fields */}
                {confirmationAction === 'add_col' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Column Name (e.g., 'Sentiment_Score')"
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="editable-cell p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full"
                        />
                        {headers.includes(newColName.trim()) && (
                            <p className="text-red-500 text-sm">A column with this name already exists.</p>
                        )}

                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <input
                                id="is-enum-checkbox"
                                type="checkbox"
                                checked={isNewColEnum}
                                onChange={(e) => setIsNewColEnum(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="is-enum-checkbox" className="text-sm font-medium text-gray-700 select-none">
                                Is this an Enum (dropdown) column?
                            </label>
                        </div>

                        {isNewColEnum && (
                            <div>
                                <label htmlFor="new-col-options" className="block text-sm font-medium text-gray-700 mb-1">
                                    Enum Options (one per line):
                                </label>
                                <textarea
                                    id="new-col-options"
                                    rows="4"
                                    placeholder="Option A\nOption B\nOption C"
                                    value={newColOptionsText}
                                    onChange={(e) => setNewColOptionsText(e.target.value)}
                                    className="editable-cell resize-y p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full text-sm"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Remove Column Selection Field */}
                {confirmationAction === 'remove_col' && (
                    <div className="space-y-4">
                        <label htmlFor="col-remove-select" className="block text-sm font-medium text-gray-700 mb-1">Column to Remove:</label>
                        <select
                            id="col-remove-select"
                            className="editable-select text-sm"
                            value={colToRemove}
                            onChange={(e) => setColToRemove(e.target.value)}
                        >
                            <option value="" disabled>-- Select a Column --</option>
                            {headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    {confirmationAction === 'new_doc' && (
                        <button
                            onClick={exportData}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg text-sm transition duration-150">
                            Export First
                        </button>
                    )}
                    <button
                        onClick={() => setIsConfirmationModalOpen(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 rounded-lg text-sm transition duration-150">
                        Cancel
                    </button>
                    <button
                        onClick={confirmAction}
                        disabled={
                            (confirmationAction === 'add_col' && (!newColName.trim() || headers.includes(newColName.trim()))) ||
                            (confirmationAction === 'remove_col' && !colToRemove)
                        }
                        className={`font-semibold py-2 px-3 rounded-lg text-sm shadow-md transition duration-150 disabled:opacity-50 ${
                            confirmationAction === 'remove_col' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}>
                        {confirmationAction === 'new_doc' ? 'Yes, Clear Data' : confirmationAction === 'add_col' ? 'Add Column' : 'Remove Column'}
                    </button>
                </div>
            </div>
        </div>
    );

    const optionManagementModal = (
        <div className={isOptionModalOpen ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75" : "hidden"}>
            {/* Option Management Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4">
                <h2 className="text-2xl font-bold mb-4">Manage Enum Options</h2>

                <div className="mb-4">
                    <label htmlFor="column-select" className="block text-sm font-medium text-gray-700 mb-1">Select Column:</label>
                    <select
                        id="column-select"
                        className="editable-select text-sm"
                        value={modalColumn || ''}
                        onChange={handleColumnSelectChange}
                        disabled={!modalColumn}
                    >
                        {enumCols.map(colName => (
                            <option key={colName} value={colName}>{colName}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="options-textarea" className="block text-sm font-medium text-gray-700 mb-1">Available Options (one per line):</label>
                    <textarea
                        id="options-textarea"
                        rows="8"
                        className="editable-cell resize-y text-sm"
                        value={modalOptionsText}
                        onChange={(e) => setModalOptionsText(e.target.value)}
                        disabled={!modalColumn}
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={saveOptions}
                        disabled={!modalColumn}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-50">
                        Save Options
                    </button>
                    <button
                        onClick={() => setIsOptionModalOpen(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );


    // --- Main Render ---

    return (
        <div className="p-4 md:p-8 min-h-screen">

            {/* Title and Controls */}
            <div className="mb-6 bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CSV Annotation Editor</h1>
                <p className="text-gray-600 mb-4">
                    Edit annotations in the table below. **Double-click any row to open the full edit form.**
                </p>

                {/* Status Message Display */}
                {message && (
                    <div
                        className={`p-3 rounded-lg text-sm mb-4 shadow-md ${
                            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                                'bg-red-100 text-red-800 border border-red-300'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 items-center">
                    {/* History Controls */}
                    <button
                        onClick={undo}
                        disabled={history.past.length === 0}
                        title="Undo Last Action (Ctrl+Z)"
                        className="flex-shrink-0 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-30">
                        Undo ({history.past.length})
                    </button>
                    <button
                        onClick={redo}
                        disabled={history.future.length === 0}
                        title="Redo Last Undo (Ctrl+Y)"
                        className="flex-shrink-0 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-30">
                        Redo ({history.future.length})
                    </button>

                    {/* Data Entry Control */}
                    <button
                        onClick={openNewRowModal}
                        disabled={loadingMessage !== null}
                        title="Add a new row with a full-screen form"
                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-30 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Row
                    </button>

                    {/* Document Controls */}
                    <button
                        onClick={() => openConfirmationModal('new_doc')}
                        className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        New Document
                    </button>
                    <button
                        onClick={exportData}
                        className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        Export to CSV
                    </button>
                    <input
                        type="file"
                        id="file-input"
                        accept=".csv"
                        onChange={handleFileLoad}
                        className="flex-grow max-w-xs text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-indigo-700 hover:file:bg-violet-100"
                    />
                </div>

                {/* Schema Controls */}
                <div className="flex flex-wrap gap-3 items-center mt-4 border-t pt-4">
                    <button
                        onClick={() => openConfirmationModal('add_col')}
                        className="flex-shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        Add New Column
                    </button>
                    <button
                        onClick={() => openConfirmationModal('remove_col', headers.length > 0 ? headers[0] : '')}
                        disabled={headers.length === 0}
                        className="flex-shrink-0 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-30">
                        Remove Column
                    </button>
                    <button
                        onClick={openOptionModal}
                        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        Manage Options
                    </button>
                </div>
            </div>

            {/* Error/Success Message Box for non-modal messages (Now uses full width) */}
            <div id="message-box" className="mb-4 h-6"></div>

            {/* Data Table Container (Scrollable) */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="table-container" className="table-container p-4 overflow-x-auto overflow-y-auto max-h-[70vh]">
                    {loadingMessage ? (
                        <p className="text-center text-gray-500 py-10 text-lg font-medium">{loadingMessage}</p>
                    ) : (
                        <table id="data-table" className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                {headers.map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap relative"
                                        style={{ width: colWidths[header] + 'px' }}
                                    >
                                        {header}
                                        {enumColumns[header]?.isEnum && <span className="ml-1 text-indigo-500 text-xs">(Enum)</span>}

                                        {/* Resize Handle */}
                                        <div
                                            onMouseDown={(e) => startResize(e, header)}
                                            className="resize-handle"
                                            title={`Resize ${header} column`}
                                        />
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((row) => (
                                <tr
                                    key={row.__id}
                                    className='hover:bg-gray-100 cursor-pointer transition-colors duration-150'
                                    onDoubleClick={() => handleRowDoubleClick(row.__id)}
                                    title="Double-click to edit row in full form"
                                >
                                    {headers.map((header) => (
                                        <td
                                            key={header}
                                            className="px-3 py-2 text-sm text-gray-900 border-t border-gray-200"
                                            style={{ width: colWidths[header] + 'px' }}
                                        >
                                            <EditableCell
                                                rowId={row.__id}
                                                colName={header}
                                                value={row[header]}
                                                isEnum={enumColumns[header]?.isEnum}
                                                enumOptions={enumColumns}
                                                handleEdit={handleEdit}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* NEW/EDIT ROW MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={editingRowId ? "Edit Existing Annotation Row" : "Add New Annotation Row"}
            >
                <form onSubmit={handleFormSubmit}>
                    <div className="grid-form">
                        {headers.map(renderFormField)}
                    </div>

                    <div className="mt-8 pt-4 border-t flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleModalClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150"
                        >
                            {editingRowId ? "Save Changes" : "Save New Row"}
                        </button>
                    </div>
                </form>
            </Modal>

            {optionManagementModal}
            {columnModificationModal}
        </div>
    )
}

export default App
