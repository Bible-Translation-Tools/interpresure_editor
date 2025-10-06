// --- 1. CONFIGURATION AND INITIAL DATA ---
import React from "react";


// --- 0. INDEXEDDB UTILITIES ---
const IDB_NAME = 'CSVEditorDB';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'csv_data_store';
const DATA_KEY = 'current_csv_data';

/**
 * Opens the IndexedDB database, creating the object store if necessary.
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
 * Saves the current data and headers to IndexedDB.
 */
const saveData = async (dataToSave) => {
    try {
        const db = await openDB();
        const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IDB_STORE_NAME);

        const saveObject = {
            data: dataToSave.data,
            headers: dataToSave.headers,
            enumColumns: dataToSave.enumColumns, // Save enum columns for consistency
            timestamp: new Date().toISOString()
        };

        const request = store.put(saveObject, DATA_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = (event) => {
                console.error("Save failed:", event.target.error);
                reject(event.target.error);
            };
        });

    } catch (error) {
        console.error("Could not save data to IndexedDB:", error);
    }
};

/**
 * Loads the saved data from IndexedDB.
 */
const loadData = async () => {
    try {
        const db = await openDB();
        const transaction = db.transaction([IDB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IDB_STORE_NAME);
        const request = store.get(DATA_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                console.error("Load failed:", event.target.error);
                reject(event.target.error);
            };
        });

    } catch (error) {
        console.error("Could not load data from IndexedDB:", error);
        return null;
    }
};


// --- 1. CONFIGURATION AND INITIAL DATA ---
const ENUM_THRESHOLD = 4; // Columns with <= 4 unique values are considered enums

// CSV data pre-loaded from the user's file snippet
const RAW_CSV_DATA = `ID,Book,Chapter,Verse,TokenID,GreekText,IllocutionaryForce,Modality,Stance,Evidentiality,Face,Veridicality,EntailmentPattern,InferenceType,IsCancelled,Code,Prejacent,PresuppositionType,ImplicatureType,InvitedInference,IsScalar,ScaleType,Alternative,IsExhausted,PredicationType,Question-Under-Discussion,InferredProposition,Information_Structure,Notes,,,
,Philemon,1,1,"57001001-01, 57001001-02, 57001001-03, 57001001-04",ΠΑΥΛΟΣ ΔΕΣΜΙΟΣ ΧΡΙΣΤΟΥ ΙΗΣΟΥ,N/A,Realis,Identity,N/A,N/A,Veridical,N/A,Implicature,FALSE,DefiniteDescription,"Paul is in prison because of Jesus",N/A,Particularized Conversational,N/A,FALSE,N/A,N/A,N/A,"Appositive predication, Defining","Global implicit QUD: What should Philemon do about Onesimus?","Paul is like Onesimus because he also has a master.",,"Choice of description is marked. Paul is presequencing to prepare for a latter, potentially face-threatening act. Paul explicitly honors Philemon and implicitly positions him as aligned with Paul’s mission and values. Paul anticipates that Philemon will behave accordingly when asked (especially in v. 8–10ff). Affiliative presequencing: Paul’s identifier is that he is a slave of Jesus Christ, no other identifier. Jesus is a master to Paul, but he...",,,
,Philemon,1,12,"570010120010, 570010120020, 570010120030, 570010120040",ΟΝ ΗΓΑΠΗΜΕΝΕ,N/A,N/A,Attitudinal,N/A,N/A,N/A,N/A,N/A,FALSE,Interjection,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,"Paul is using an affective address: he is feeling a lack of love from his church in Rome.",N/A,N/A,"Paul is presequencing, trying to mitigate the face threat inherent in asking Philemon to do something. He emphasizes his deep affection for him. There is a sense of 'If you love me, then you will do this thing.'",,,
,Philemon,1,17,"570010170010, 570010170020, 570010170030, 570010170040",ΕΙ ΟΥΝ ΜΕ ΕΧΕΙΣ ΚΟΙΝΩΝΟΝ,N/A,Hypothetical,N/A,N/A,N/A,Veridical,N/A,N/A,FALSE,Conjunction,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,"QUD: Does Paul have the right to request this action?","Paul is appealing to Philemon's prior relationship/commitment to Paul to justify the request.",,"The conditional is of the 'If X then Y' type, where X is taken to be true. Paul is using the first part as a premise for the second part (v. 17b). This acts as a presequencing element.",,,
,Philemon,1,21,"570010210010, 570010210020, 570010210030, 570010210040, 570010210050, 570010210060, 570010210070, 570010210080, 570010210090, 570010210100, 570010210110, 570010210120010, 570010210130010, 570010210140010",ΠΕΠΟΙΘΩΣ ΤΗ ΥΠΑΚΟΗ ΣΟΥ ΕΓΡΑΨΑ ΣΟΙ ΕΙΔΩΣ ΟΤΙ ΚΑΙ ΥΠΕΡ Ο ΖΗΤΩ ΠΟΙΗΣΕΙΣ,N/A,Realis,Epistemic,Attitudinal,N/A,Veridical,N/A,N/A,FALSE,Verb,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"Attitude report is used as a hedge (Paul is not asking something unreasonable, given the character of Philemon). Character sequencing reaches a crescendo. Paul expects more than the baseline. Will Philemon live up to his reputation?",,,
,Philemon,1,22,"570010220010010, 570010220020010",ΑΜΑ ΔΕ ΚΑΙ,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,FALSE,Verb,N/A,N/A,N/A,N/A,TRUE,N/A,N/A,FALSE,N/A,,Paul is adding this directive to the previous sequence of directives: receive and refresh,,,,
,Philemon,1,22,"570010220030010, 570010220040010, 570010220050010",ΕΤΟΙΜΑΖΕ ΜΟΙ ΞΕΝΙΑΝ,N/A,Directive,N/A,N/A,N/A,N/A,N/A,N/A,FALSE,Verb,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,"QUD: Should Philemon prepare a guest room for Paul?","Paul is directing Philemon to prepare a guest room for him.",,"This is a command, and is a pre-sequence (Paul is anticipating his arrival).",,,
,Philemon,1,23,570010230010,ΕΠΑΦΡΑΣ,N/A,N/A,Identity,N/A,N/A,N/A,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"This serves to introduce Epaphras to Philemon, and it serves an affiliative function.",,,
,Philemon,1,23,570010230020,Ο ΣΥΝΑΙΧΜΑΛΩΤΟΣ,N/A,Realis,Identity,N/A,N/A,Veridical,N/A,N/A,FALSE,DefiniteDescription,Epaphras is a fellow prisoner,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,"Appositive predication, Defining",Global implicit QUD: Who is Epaphras?,Epaphras is a fellow worker.,,"The appositive phrase is marked, as it emphasizes the strong commitment of Epaphras to the gospel, and it serves an affiliative function.",,,
,Philemon,1,24,570010240010,ΜΑΡΚΟΣ,N/A,N/A,Identity,N/A,N/A,N/A,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"This serves to introduce Mark to Philemon, and it serves an affiliative function.",,,
,Philemon,1,24,570010240020,ΑΡΙΣΤΑΡΧΟΣ,N/A,N/A,Identity,N/A,N/A,N/A,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"This serves to introduce Aristarchus to Philemon, and it serves an affiliative function.",,,
,Philemon,1,24,570010240030,ΔΗΜΑΣ,N/A,N/A,Identity,N/A,N/A,N/A,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"This serves to introduce Demas to Philemon, and it serves an affiliative function.",,,
,Philemon,1,24,570010240040,ΛΟΥΚΑΣ,N/A,N/A,Identity,N/A,N/A,N/A,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"This serves to introduce Luke to Philemon, and it serves an affiliative function.",,,
,Philemon,1,24,"570010240050, 570010240060",ΟΙ ΣΥΝΕΡΓΟΙ ΜΟΥ,N/A,Realis,Identity,N/A,N/A,Veridical,N/A,N/A,FALSE,DefiniteDescription,They are Paul's fellow workers,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,"Appositive predication, Defining",Global implicit QUD: Who are these men?,They are Paul's fellow workers.,,"The appositive phrase is marked, as it emphasizes the strong commitment of these men to the gospel, and it serves an affiliative function.",,,
,Philemon,1,25,"570010250010, 570010250020, 570010250030, 570010250040, 570010250050",Η ΧΑΡΙΣ ΤΟΥ ΚΥΡΙΟΥ ΙΗΣΟΥ ΧΡΙΣΤΟΥ,N/A,Realis,Identity,N/A,N/A,Veridical,N/A,N/A,FALSE,Noun,N/A,N/A,N/A,N/A,FALSE,N/A,N/A,N/A,N/A,,N/A,,"Final closing formula. Paul is making a final wish for Philemon. Affiliative closing formula: Paul is blessing Philemon with the grace of the Lord Jesus Christ.",,,
`;

// --- 2. CSV UTILITIES (Pure Functions) ---

/**
 * Parses a CSV string into an array of objects.
 * Handles quoted fields and multi-line content (simplified for reliable parsing in this environment).
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
        // Assign a unique ID for tracking edits
        rowObject.__id = i;
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
        // If the string contains comma, quote, or newline, wrap it in double quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [];
    // 1. Header Row
    csvRows.push(headers.map(escapeValue).join(','));

    // 2. Data Rows
    data.forEach(row => {
        // Exclude the internal __id property when generating CSV
        const values = headers.map(header => escapeValue(row[header]));
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
};


// --- 3. REACT COMPONENTS ---

// Component for rendering a single cell
const EditableCell = React.memo(({ rowId, colName, value, isEnum, enumOptions, handleEdit }) => {
    const colOptions = enumOptions[colName];

    // Determine if the value requires a textarea (for long text)
    const isLongText = value && (value.length > 50 || value.includes('\n'));
    const rows = isLongText ? Math.max(3, Math.ceil(value.length / 50)) : undefined;

    // Handler for text input/textarea blur event
    const handleBlur = (e) => {
        handleEdit(rowId, colName, e.target.value);
    };

    // Handler for select change event
    const handleChange = (e) => {
        handleEdit(rowId, colName, e.target.value);
    };

    const inputClasses = "editable-cell p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 w-full";
    const selectClasses = "editable-select p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 w-full bg-white";

    if (isEnum && colOptions) {
        // Dropdown rendering for Enum columns
        const optionsSet = colOptions.options;
        let currentOptions = Array.from(optionsSet).sort();

        // Ensure the current value is always an option
        if (value && !optionsSet.has(value)) {
            currentOptions = [value, ...currentOptions];
        }

        return (
            <select
                className={selectClasses}
                value={value || ''}
                onChange={handleChange}
            >
                {/* Allow empty string selection for clearing the cell */}
                <option value="">(None)</option>
                {currentOptions.map((optionText, index) => (
                    <option key={index} value={optionText}>
                        {optionText}
                    </option>
                ))}
            </select>
        );
    }

    // Text input or Textarea for non-Enum columns
    if (isLongText) {
        return (
            <textarea
                className={`${inputClasses} resize-y`}
                rows={rows}
                value={value || ''}
                onBlur={handleBlur}
                onChange={(e) => handleEdit(rowId, colName, e.target.value, false)} // Immediate update for textareas is better UX
            />
        );
    }

    return (
        <input
            type="text"
            className={inputClasses}
            value={value || ''}
            onBlur={handleBlur}
            onChange={(e) => handleEdit(rowId, colName, e.target.value, false)} // Immediate update for inputs
        />
    );
});

// Use React.useState, etc. which are available globally via the CDN scripts
const { useState, useEffect, useCallback, useMemo } = React;


// Main Application Component
const App = () => {
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [enumColumns, setEnumColumns] = useState({});
    const [loadingMessage, setLoadingMessage] = useState('Loading data...');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalColumn, setModalColumn] = useState(null);
    const [modalOptionsText, setModalOptionsText] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [messageType, setMessageType] = useState('error'); // 'error' or 'success'

    // --- Data Parsing and Initialization ---

    /**
     * Identifies enum columns and builds their initial options set.
     */
    const identifyEnumColumns = useCallback((currentHeaders, currentData) => {
        const columnValues = {};
        const newEnumColumns = {};

        // 1. Collect all unique values for each column
        currentHeaders.forEach(header => {
            columnValues[header] = new Set();
        });

        currentData.forEach(row => {
            currentHeaders.forEach(header => {
                const value = row[header];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    columnValues[header].add(String(value).trim());
                }
            });
        });

        // 2. Determine enum status and build initial options
        currentHeaders.forEach(header => {
            const uniqueValues = Array.from(columnValues[header]);
            const isEnum = uniqueValues.length > 0 && uniqueValues.length <= ENUM_THRESHOLD;

            newEnumColumns[header] = {
                isEnum: isEnum,
                options: columnValues[header]
            };
        });

        setEnumColumns(newEnumColumns);
        return newEnumColumns;
    }, []);

    // --- EFFECT 1: Load initial data (from IndexedDB or default CSV) ---
    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingMessage('Checking for saved data...');
            let initialData = null;
            let initialEnums = {};

            // 1. Try loading from IndexedDB
            const savedState = await loadData();

            if (savedState && savedState.data && savedState.headers) {
                setLoadingMessage('Loading saved data...');
                initialData = { data: savedState.data, headers: savedState.headers };
                initialEnums = savedState.enumColumns || identifyEnumColumns(initialData.headers, initialData.data);
            } else {
                // 2. Fallback to raw hardcoded CSV
                setLoadingMessage('No saved data found. Loading default CSV...');
                const result = parseCSV(RAW_CSV_DATA);
                initialData = result;
                initialEnums = identifyEnumColumns(initialData.headers, initialData.data);
            }

            try {
                // Ensure IDs are present and update state
                const dataWithIds = initialData.data.map((row, i) => ({ ...row, __id: row.__id || i + 1 }));

                setHeaders(initialData.headers);
                setData(dataWithIds);
                setEnumColumns(initialEnums);
                setLoadingMessage(null);
            } catch (error) {
                console.error("Error processing data:", error);
                setLoadingMessage('Error processing data. Check console for details.');
            }
        };

        loadInitialData();
    }, [identifyEnumColumns]);

    // --- EFFECT 2: Auto-save to IndexedDB whenever data or headers change ---
    useEffect(() => {
        // Only save if data has been loaded and initialized
        if (data.length > 0 && headers.length > 0 && loadingMessage === null) {
            saveData({ data, headers, enumColumns });
            // console.log("Autosaved data to IndexedDB.");
        }
    }, [data, headers, enumColumns, loadingMessage]); // Also save when enumColumns changes


    // --- Data Editing and Handling ---

    /**
     * Updates the internal data structure when a cell is edited.
     */
    const handleEdit = useCallback((rowId, colName, newValue, checkEnum=true) => {
        const trimmedValue = newValue.trim();

        setData(prevData => {
            const newData = prevData.map(row => {
                if (row.__id === rowId) {
                    return { ...row, [colName]: trimmedValue };
                }
                return row;
            });

            // Check if we need to update enum options (only if it's an enum column and the value is new)
            if (checkEnum && enumColumns[colName]?.isEnum && trimmedValue !== '' && !enumColumns[colName].options.has(trimmedValue)) {
                setEnumColumns(prevEnums => {
                    const newEnums = { ...prevEnums };
                    // Clone the set before modification
                    const newOptions = new Set(newEnums[colName].options);
                    newOptions.add(trimmedValue);
                    newEnums[colName] = { ...newEnums[colName], options: newOptions };
                    return newEnums;
                });
            }
            return newData;
        });
    }, [enumColumns]);

    /**
     * Exports the current data to a downloadable CSV file.
     */
    const exportData = useCallback(() => {
        const csvContent = toCSV(data, headers);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const date = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `InterpreSure_Annotations_edited_${date}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data, headers]);

    /**
     * Loads a new CSV file.
     */
    const handleFileLoad = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            setLoadingMessage('Loading custom file...');

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const result = parseCSV(event.target.result);
                    // Ensure fresh IDs for the new file
                    const dataWithIds = result.data.map((row, i) => ({ ...row, __id: i + 1 }));

                    setHeaders(result.headers);
                    setData(dataWithIds);
                    identifyEnumColumns(result.headers, dataWithIds);
                    setLoadingMessage(null);
                } catch (error) {
                    setLoadingMessage('Error reading file. Check console for details.');
                    console.error('File Read Error:', error);
                }
            };
            reader.readAsText(file);
        }
    }, [identifyEnumColumns]);

    // --- Modal Logic ---

    const enumCols = useMemo(() => {
        return headers.filter(h => enumColumns[h]?.isEnum);
    }, [headers, enumColumns]);

    const openModal = useCallback(() => {
        if (enumCols.length === 0) {
            // Using a custom div instead of alert()
            const msgBox = document.getElementById('message-box');
            msgBox.innerHTML = `<p class="text-sm text-red-500 p-2 bg-red-100 rounded-lg">No enum columns detected (Unique values <= ${ENUM_THRESHOLD}).</p>`;
            setTimeout(() => msgBox.innerHTML = '', 3000);
            return;
        }

        const initialCol = enumCols[0];
        setModalColumn(initialCol);

        const optionsArray = Array.from(enumColumns[initialCol].options).sort();
        setModalOptionsText(optionsArray.join('\n'));
        setModalMessage('');
        setIsModalOpen(true);
    }, [enumCols, enumColumns]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setModalColumn(null);
        setModalMessage('');
        setModalOptionsText('');
    }, []);

    const handleColumnSelectChange = useCallback((e) => {
        const selectedCol = e.target.value;
        setModalColumn(selectedCol);

        const optionsArray = Array.from(enumColumns[selectedCol].options).sort();
        setModalOptionsText(optionsArray.join('\n'));
        setModalMessage('');
    }, [enumColumns]);

    const saveOptions = useCallback(() => {
        if (!modalColumn) return;

        const newOptionsArray = modalOptionsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        if (newOptionsArray.length === 0) {
            setMessageType('error');
            setModalMessage('Options list cannot be empty. Please add at least one option.');
            return;
        }

        // Update global state
        setEnumColumns(prevEnums => ({
            ...prevEnums,
            [modalColumn]: {
                ...prevEnums[modalColumn],
                options: new Set(newOptionsArray)
            }
        }));

        // Display success message
        setMessageType('success');
        setModalMessage(`Options for '${modalColumn}' saved successfully!`);

        // Let the useEffect hook handle the IndexedDB save automatically
        setTimeout(closeModal, 1000);
    }, [modalColumn, modalOptionsText, closeModal]);

    const modalClasses = isModalOpen ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75" : "hidden";
    const modalCardClasses = isModalOpen
        ? "bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 transition-all duration-300 transform scale-100 opacity-100"
        : "bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 m-4 transition-all duration-300 transform scale-95 opacity-0";

    // --- Rendering ---

    return (
        <div className="p-4 md:p-8 min-h-screen">
            <style>{`
                /* Custom styles for the table and scrollbar */
                .table-container::-webkit-scrollbar { width: 12px; height: 12px; }
                .table-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 6px; border: 3px solid #f3f4f6; }
                .table-container::-webkit-scrollbar-track { background-color: #f3f4f6; }
                .editable-cell, .editable-select { transition: all 0.15s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
                .editable-cell:focus, .editable-select:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); }
                th { position: sticky; top: 0; background-color: #ffffff; z-index: 10; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); min-width: 150px; }
                td { min-width: 150px; }
            `}</style>

            {/* Title and Controls */}
            <div className="max-w-7xl mx-auto mb-6 bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">CSV Data Editor (React)</h1>
                <p className="text-gray-600 mb-6">
                    Edit data, manage dropdown options for categorical columns, and export the result.
                    <span className="font-semibold text-indigo-500">Your edits are automatically saved to your browser's local storage.</span>
                </p>

                <div className="flex flex-wrap gap-4 items-center">
                    <button
                        onClick={openModal}
                        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        Manage Options
                    </button>
                    <button
                        onClick={exportData}
                        className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150">
                        Export Data to CSV
                    </button>
                    <input
                        type="file"
                        id="file-input"
                        accept=".csv"
                        onChange={handleFileLoad}
                        className="flex-grow max-w-xs text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-indigo-700 hover:file:bg-violet-100"
                    />
                </div>
            </div>

            {/* Error/Success Message Box for non-modal messages */}
            <div id="message-box" className="max-w-7xl mx-auto mb-4 h-6"></div>

            {/* Data Table Container */}
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div id="table-container" className="table-container p-4 overflow-x-auto overflow-y-auto max-h-[70vh]">
                    {loadingMessage ? (
                        <p className="text-center text-gray-500 py-10">{loadingMessage}</p>
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

            {/* Options Management Modal */}
            <div className={modalClasses}>
                <div className={modalCardClasses}>
                    <h2 className="text-2xl font-bold mb-4">Manage Enum Options</h2>

                    <div className="mb-4">
                        <label htmlFor="column-select" className="block text-sm font-medium text-gray-700 mb-1">Select Column:</label>
                        <select
                            id="column-select"
                            className="editable-select"
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
                            className="editable-cell resize-y"
                            value={modalOptionsText}
                            onChange={(e) => setModalOptionsText(e.target.value)}
                            disabled={!modalColumn}
                        ></textarea>
                    </div>

                    {modalMessage && (
                        <p className={`text-sm mb-4 ${messageType === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                            {modalMessage}
                        </p>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            id="save-options-btn"
                            onClick={saveOptions}
                            disabled={!modalColumn}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 disabled:opacity-50">
                            Save Changes
                        </button>
                        <button
                            id="close-modal-btn"
                            onClick={closeModal}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
