let currentNote = '';
let currentTag = '';
const markdownEditor = document.getElementById('markdownEditor');
const previewPane = document.getElementById('previewPane');
const documentList = document.getElementById('documentList');
const currentDocTitle = document.getElementById('currentDocTitle');
const saveTitleButton = document.getElementById('saveTitleButton');

migrateOldNotes();

function getFirstNote() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        if (noteData && noteData.content !== undefined) {
            return key;
        }
    }
    return null; // Return null if no valid notes are found
}

function initializeNotes() {
    if (localStorage.length === 0) {
        const welcomeNote = "# Welcome to Markdown Notepad!\n\n" +
            "## Features:\n" +
            "1. Create new documents with the 'new' button\n" +
            "2. Edit document titles by clicking on them\n" +
            "3. Export your notes as Markdown files\n" +
            "4. Delete unwanted notes\n" +
            "5. Resize the app window by dragging the bottom-right corner\n" +
            "6. Drag and drop .md files into the app to load them\n" +
            "7. Use the 'import' button to select and load .md files\n\n" +
            "Enjoy writing in **Markdown**!";

        const markdownGuide = `# Markdown Syntax Guide
## Headers
# H1
## H2
### H3
#### H4
##### H5
###### H6
## Emphasis
*This text will be italic*
*This will also be italic*
**This text will be bold**
**This will also be bold**
*You ****can**** combine them*
## Lists
### Unordered
* Item 1
* Item 2
  * Item 2a
  * Item 2b
### Ordered
1. Item 1
2. Item 2
3. Item 3
   1. Item 3a
   2. Item 3b
## Links
[GitHub](http://github.com)
## Images
![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)
## Blockquotes
As Kanye West said:
> We're living the future so
> the present is our past.
## Inline code
I think you should use an
\`<addr>\` element here instead.
## Code Blocks
\`\`\`javascript
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
\`\`\`
## Task Lists
- [x] @mentions, #refs, [links](), **formatting**, and <del>tags</del> supported
- [x] list syntax required (any unordered or ordered list supported)
- [x] this is a complete item
- [ ] this is an incomplete item
## Tables
| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
## Strikethrough
~~This text is strikethrough~~
## Horizontal Rule
---
## Emoji
:smile: :laughing: :blush: :smiley: :relaxed:
## Footnotes
Here's a sentence with a footnote. [^1]
[^1]: This is the footnote.
## Definition Lists
term
: definition
## Abbreviations
The HTML specification is maintained by the W3C.
*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium
## LaTeX Math (if supported by your Markdown renderer)
When $a \\ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are 
$$ x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a} $$`;

        setNoteData("Welcome Note", welcomeNote, []);
        setNoteData("Markdown Guide", markdownGuide, []);
    }
    updateDocumentList();
    const firstNoteKey = getFirstNote();
    if (firstNoteKey) {
        loadNote(firstNoteKey);
    } else {
        newNote();
    }
}

function updateDocumentList() {
    documentList.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);

        // Skip this note if it doesn't have the current tag (unless no tag is selected)
        if (currentTag && (!noteData.tags || !noteData.tags.includes(currentTag))) {
            continue;
        }

        const li = document.createElement('li');
        li.textContent = `├ ${key}`;
        li.onclick = () => loadNote(key);
        if (key === currentNote) {
            li.classList.add('active');
        }
        documentList.appendChild(li);
    }
}


function loadNote(key) {
    if (currentNote) {
        saveNote();
    }

    const noteData = getNoteData(key);

    if (!noteData || noteData.content === undefined) {
        console.warn(`Note "${key}" not found. Loading first available note.`);
        const firstNoteKey = getFirstNote();

        if (firstNoteKey) {
            currentNote = firstNoteKey;
            loadNote(firstNoteKey); // Recursive call with the first available note
        } else {
            console.error("No valid notes found. Creating a new note.");
            newNote();
        }
        return;
    }

    currentNote = key;
    markdownEditor.value = noteData.content || '';
    currentDocTitle.textContent = key;
    currentTag = ''; // Clear the tag filter
    document.getElementById('tagFilter').value = ''; // Reset the dropdown
    updateDocumentList();
    renderMarkdown();
    displayTags();
}

function renderMarkdown() {
    const markdown = markdownEditor.value;
    const html = DOMPurify.sanitize(marked.parse(markdown));
    previewPane.innerHTML = html;
}

function saveNote() {
    if (currentNote) {
        const noteData = getNoteData(currentNote);
        noteData.content = markdownEditor.value;
        setNoteData(currentNote, noteData.content, noteData.tags);
        updateDocumentList();
    }
}

function autoSave() {
    saveNote();
    renderMarkdown();
}

function deleteNote() {
    localStorage.removeItem(currentNote);
    noteContent.value = '';
    currentNote = '';
    currentDocTitle.textContent = 'No document selected';
    updateDocumentList();
    closeModal('deleteModal');
}

function newNote() {
    if (currentNote) {
        saveNote();
    }
    let newNoteName = `New Note`;
    let counter = 1;
    while (localStorage.getItem(newNoteName)) {
        newNoteName = `New Note (${counter})`;
        counter++;
    }
    localStorage.setItem(newNoteName, '');
    loadNote(newNoteName);
}

function exportNote() {
    if (currentNote) {
        const content = localStorage.getItem(currentNote);
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${currentNote}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('Please select a document first.');
    }
}

function editTitle() {
    if (currentNote) {
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = currentNote;
        titleInput.className = 'title-input';
        currentDocTitle.replaceWith(titleInput);
        titleInput.focus();

        // Create save button if it doesn't exist
        let saveTitleButton = document.getElementById('saveTitleButton');
        if (!saveTitleButton) {
            saveTitleButton = document.createElement('button');
            saveTitleButton.id = 'saveTitleButton';
            saveTitleButton.textContent = 'Save';
            currentDocTitle.parentNode.insertBefore(saveTitleButton, currentDocTitle.nextSibling);
        }
        saveTitleButton.style.display = 'inline-block';

        // Hide other buttons
        document.querySelectorAll('.document-header button:not(#saveTitleButton)').forEach(btn => {
            btn.style.display = 'none';
        });

        titleInput.onblur = () => {
            if (!saveTitleButton.contains(document.activeElement)) {
                saveTitle();
            }
        };

        titleInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTitle();
            } else if (e.key === 'Escape') {
                restoreTitle();
            }
        };

        // Add click event for the save button
        saveTitleButton.onclick = (e) => {
            e.preventDefault();
            saveTitle();
        };
    }
}

function saveTitle() {
    const titleInput = document.querySelector('.title-input');
    if (titleInput && titleInput.value.trim() !== '') {
        const oldTitle = currentNote;
        const newTitle = titleInput.value.trim();

        if (oldTitle !== newTitle) {
            const noteData = getNoteData(oldTitle);
            localStorage.removeItem(oldTitle);
            setNoteData(newTitle, noteData.content, noteData.tags);
            currentNote = newTitle;
        }

        restoreTitle();
        updateDocumentList();

        // Focus on the newly renamed document
        const newDocumentItem = Array.from(documentList.children).find(li => li.textContent.includes(newTitle));
        if (newDocumentItem) {
            newDocumentItem.click();
        }
    } else {
        restoreTitle();
    }
}

function restoreTitle() {
    const titleInput = document.querySelector('.title-input');
    if (titleInput) {
        currentDocTitle.textContent = currentNote;
        titleInput.replaceWith(currentDocTitle);
        const saveTitleButton = document.getElementById('saveTitleButton');
        if (saveTitleButton) {
            saveTitleButton.style.display = 'none';
        }

        // Show other buttons
        document.querySelectorAll('.document-header button:not(#saveTitleButton)').forEach(btn => {
            btn.style.display = 'inline-block';
        });
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            let fileName = file.name.replace('.txt', '').replace('.md', '');
            if (localStorage.getItem(fileName)) {
                let counter = 1;
                while (localStorage.getItem(`${fileName} (${counter})`)) {
                    counter++;
                }
                fileName = `${fileName} (${counter})`;
            }
            localStorage.setItem(fileName, content);
            loadNote(fileName);
        };
        reader.readAsText(file);
    }
    // Reset the file input
    event.target.value = '';
}

// Drag and drop functionality
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.kind === 'file' && item.type === 'text/plain') {
            document.getElementById('dropOverlay').style.display = 'flex';
        }
    }
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
        document.getElementById('dropOverlay').style.display = 'none';
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropOverlay').style.display = 'none';
    dragCounter = 0;
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            let fileName = files[0].name.replace('.txt', '');
            if (localStorage.getItem(fileName)) {
                let counter = 1;
                while (localStorage.getItem(`${fileName} (${counter})`)) {
                    counter++;
                }
                fileName = `${fileName} (${counter})`;
            }
            localStorage.setItem(fileName, content);
            loadNote(fileName);
        };
        reader.readAsText(files[0]);
    }
});

function openCheatSheet() {
    const modal = document.getElementById('cheatSheetModal');
    const content = document.getElementById('cheatSheetContent');

    // Populate the cheat sheet content
    content.innerHTML = `
    <h3>Headers</h3>
    <pre># H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6</pre>

    <h3>Emphasis</h3>
    <pre>*italic*   **bold**\n_italic_   __bold__</pre>

    <h3>Lists</h3>
    <pre>1. First ordered item\n2. Second item\n\n- Unordered item\n- Another item</pre>

    <h3>Links</h3>
    <pre>[Link Text](http://www.example.com)</pre>

    <h3>Images</h3>
    <pre>![Alt Text](http://www.example.com/image.jpg)</pre>

    <h3>Blockquotes</h3>
    <pre>> This is a blockquote</pre>

    <h3>Code</h3>
    <pre>\`inline code\`\n\n\`\`\`\ncode block\n\`\`\`</pre>
  `;

    modal.style.display = 'block';
}

function closeCheatSheet() {
    const modal = document.getElementById('cheatSheetModal');
    modal.style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('cheatSheetModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


function addTag(event) {
    if (event.key === 'Enter' && currentNote) {
        const tags = event.target.value.split(',').map(tag => tag.trim());
        const noteData = getNoteData(currentNote);
        noteData.tags = [...new Set([...(noteData.tags || []), ...tags])];
        setNoteData(currentNote, noteData.content, noteData.tags);
        event.target.value = '';
        displayTags();
        updateTagFilter();
        updateDocumentList(); // Add this line
    }
}

function displayTags() {
    const tagDisplay = document.getElementById('tagDisplay');
    const noteData = getNoteData(currentNote);
    tagDisplay.innerHTML = '';
    if (noteData.tags) {
        noteData.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-pill';
            tagElement.innerHTML = `${tag}<span class="remove-tag" onclick="removeTag('${tag}')">×</span>`;
            tagDisplay.appendChild(tagElement);
        });
    }
}

function removeTag(tag) {
    const noteData = getNoteData(currentNote);
    noteData.tags = noteData.tags.filter(t => t !== tag);
    setNoteData(currentNote, noteData.content, noteData.tags);
    displayTags();
    updateTagFilter();
    updateDocumentList(); // Add this line
}

function updateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    const allTags = new Set();
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        if (noteData.tags) {
            noteData.tags.forEach(tag => allTags.add(tag));
        }
    }
    tagFilter.innerHTML = '<option value="">Filter by tag</option>';
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function migrateOldNotes() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const noteData = getNoteData(key);
        setNoteData(key, noteData.content, noteData.tags);
    }
}

function filterByTag(tag) {
    currentTag = tag;
    updateDocumentList();
}

function getNoteData(key) {
    const data = localStorage.getItem(key);
    try {
        return JSON.parse(data);
    } catch (e) {
        // If parsing fails, it's probably an old format note (just a string)
        return { content: data, tags: [] };
    }
}

function setNoteData(key, content, tags = []) {
    localStorage.setItem(key, JSON.stringify({ content, tags }));
}

document.getElementById('tagInput').addEventListener('keypress', addTag);
document.getElementById('tagFilter').addEventListener('change', (e) => {
    filterByTag(e.target.value);
});

markdownEditor.addEventListener('input', autoSave);
initializeNotes();