// --- 1. CONFIGURATION AND INITIAL DATA ---
import React from "react";

// --- 0. CONFIGURATION & INDEXEDDB UTILITIES ---

const IDB_NAME = 'CSVEditorDB';
const IDB_VERSION = 2;
const IDB_STORE_NAME = 'csv_data_store';
const DATA_KEY = 'current_csv_data'; // The current table content (transient)
const SCHEMA_KEY = 'persistent_csv_schema'; // Headers and Enum options (persistent)

// Static list of columns that must be treated as Enums
const STATIC_ENUM_COLUMNS = [
    "IllocutionaryForce", "Modality", "Stance", "Evidentiality", "Veridicality",
    "EntailmentPattern", "InferenceType", "IsCancelled", "Code", "PresuppositionType",
    "ImplicatureType", "IsScalar", "ScaleType", "IsExhausted", "PredicationType",
    "Information_Structure"
];

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
        if (dataToSave && dataToSave.enumColumns) {
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
                if (result && result.enumColumns) {
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

    const headers = lines[0].split(',').map(h => h.trim());
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


// --- 3. REACT COMPONENTS ---
const { useState, useEffect, useCallback, useMemo } = React;

// Component for rendering a single cell
const EditableCell = React.memo(({ rowId, colName, value, isEnum, enumOptions, handleEdit }) => {
    const colOptions = enumOptions[colName];
    const isLongText = value && (value.length > 50 || value.includes('\n'));
    const rows = isLongText ? Math.max(3, Math.ceil(value.length / 50)) : undefined;

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

    // History state for undo/redo
    const [history, setHistory] = useState({ past: [], future: [] });

    // Modal state for Option Management
    const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
    const [modalColumn, setModalColumn] = useState(null);
    const [modalOptionsText, setModalOptionsText] = useState('');

    // Modal state for Confirmation/Add/Remove Column
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState(null); // 'new_doc', 'add_col', or 'remove_col'
    const [confirmationMessage, setConfirmationMessage] = useState('');

    // State for Add/Remove Column specific fields
    const [newColName, setNewColName] = useState('');
    const [isNewColEnum, setIsNewColEnum] = useState(false);
    const [newColOptionsText, setNewColOptionsText] = useState('');
    const [colToRemove, setColToRemove] = useState('');

    // --- History Management ---

    /**
     * Commits the current state (data, headers, enums) to the history stack.
     */
    const commitState = useCallback((newData, newHeaders, newEnums) => {
        setHistory(prevHistory => {
            const newPast = [...prevHistory.past, { data: data, headers: headers, enumColumns: enumColumns }];
            return {
                past: newPast,
                future: [], // Clear future on new commit
            };
        });
        setData(newData);
        setHeaders(newHeaders);
        setEnumColumns(newEnums);

        // Also save the schema since it might have changed
        saveSchema(newHeaders, newEnums);
    }, [data, headers, enumColumns]); // Dependencies must be current state variables

    /**
     * Sets the state from a history object (undo/redo).
     */
    const setStateFromHistory = useCallback((historyState) => {
        setData(historyState.data);
        setHeaders(historyState.headers);
        setEnumColumns(historyState.enumColumns);
        saveSchema(historyState.headers, historyState.enumColumns); // Save schema on restore
    }, []);

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

    const saveSchema = useCallback((currentHeaders, currentEnums) => {
        saveToDB(SCHEMA_KEY, { headers: currentHeaders, enumColumns: currentEnums });
    }, []);

    // --- EFFECT 1: Initial Load ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMessage('Checking for saved schema and data...');

            // 1. Load persistent Schema (Headers & Enum Options)
            const savedSchema = await loadFromDB(SCHEMA_KEY);
            const persistentHeaders = savedSchema?.headers || [];
            const persistentEnums = savedSchema?.enumColumns || {};

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

                // Re-initialize enums based on the final headers and the persistent enum options
                const finalEnums = initializeEnumColumns(finalHeaders, initialDataResult.data, persistentEnums);

                // Ensure all rows have all headers (add empty string for new columns)
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
                setLoadingMessage(null);

                // Set the initial state as the first item in the history (not committed, just current)
                setHistory({ past: [], future: [] });

                // Save the (potentially updated) schema on first load
                saveSchema(finalHeaders, finalEnums);

            } catch (error) {
                console.error("Error processing data:", error);
                setLoadingMessage('Error processing data. Check console for details.');
            }
        };

        loadInitialData();
    }, [saveSchema]);


    // --- EFFECT 2: Auto-save Document Data ---
    useEffect(() => {
        if (data.length > 0 && headers.length > 0 && loadingMessage === null) {
            const timeoutId = setTimeout(saveDocumentData, 500); // Debounce save
            return () => clearTimeout(timeoutId);
        }
    }, [data, saveDocumentData, headers, loadingMessage]);

    // --- Core Handlers ---

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

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const result = parseCSV(event.target.result);

                    // Combine file headers with persistent custom headers
                    const newHeadersSet = new Set([...result.headers, ...persistentHeaders]);
                    const finalHeaders = Array.from(newHeadersSet);

                    // Re-initialize enums structure
                    const finalEnums = initializeEnumColumns(finalHeaders, result.data, persistentEnums);

                    // Ensure all rows have the full set of headers
                    const dataWithCompleteHeaders = result.data.map((row, i) => {
                        const newRow = { ...row, __id: i + 1 + Math.random() };
                        finalHeaders.forEach(h => {
                            if (newRow[h] === undefined) newRow[h] = '';
                        });
                        return newRow;
                    });

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


    // --- Add/Remove Column Modal Logic ---

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

            // Commit removing column
            commitState(updatedData, updatedHeaders, updatedEnums);
        }

        // Clear temp state
        setNewColName('');
        setIsNewColEnum(false);
        setNewColOptionsText('');
        setColToRemove('');
    }, [confirmationAction, newColName, isNewColEnum, newColOptionsText, colToRemove, headers, data, enumColumns, commitState]);

    // Helper to sync schema state after option management
    useEffect(() => {
        if (isOptionModalOpen === false && modalColumn !== null) {
            // After options modal closes, commit the change to history
            commitState(data, headers, enumColumns);
            setModalColumn(null); // Clear to prevent repeated saving
        }
    }, [isOptionModalOpen, modalColumn, data, headers, enumColumns, commitState]);


    // --- Option Management Modal Logic ---
    const enumCols = useMemo(() => headers.filter(h => enumColumns[h]?.isEnum), [headers, enumColumns]);

    const openOptionModal = () => {
        if (enumCols.length === 0) {
            const msgBox = document.getElementById('message-box');
            msgBox.innerHTML = `<p class="text-sm text-red-500 p-2 bg-red-100 rounded-lg">No enum columns available to manage. Add a new enum column first.</p>`;
            setTimeout(() => msgBox.innerHTML = '', 3000);
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

    // --- Modal Markup (Combined for simplicity) ---
    const columnModificationModal = (
        <div className={isConfirmationModalOpen ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75" : "hidden"}>
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
            <div className="max-w-7xl mx-auto mb-6 bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CSV Annotation Editor</h1>
                <p className="text-gray-600 mb-4">
                    Edit annotations in the table below. The schema (headers and dropdown options) are saved automatically and carry over to new documents.
                    <span className="font-semibold text-indigo-500">All changes are auto-saved and trackable with Undo/Redo.</span>
                </p>

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

            {/* Error/Success Message Box for non-modal messages */}
            <div id="message-box" className="max-w-7xl mx-auto mb-4 h-6"></div>

            {/* Data Table Container */}
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
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
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                    >
                                        {header}
                                        {enumColumns[header]?.isEnum && <span className="ml-1 text-indigo-500 text-xs">(Enum)</span>}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((row) => (
                                <tr key={row.__id} className='hover:bg-gray-50'>
                                    {headers.map((header) => (
                                        <td key={header} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200">
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

            {optionManagementModal}
            {columnModificationModal}
        </div>
    )
}

export default App
