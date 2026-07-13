/* ===========================
   MINDMAP JAVASCRIPT
   =========================== */

// Global state
let mindmapState = {
    selectedSubject: null,
    selectedChapterId: null,
    selectedChapterName: null,
    allExpanded: false,
    mindmapData: null
};

// ===========================
// MODAL MANAGEMENT
// ===========================

function openSubjectModal() {
    const modal = document.getElementById('subjectModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeChapterModal() {
    const modal = document.getElementById('chapterModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openChapterModal() {
    const modal = document.getElementById('chapterModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal on outside click
document.addEventListener('DOMContentLoaded', function() {
    const subjectModal = document.getElementById('subjectModal');
    const chapterModal = document.getElementById('chapterModal');

    subjectModal.addEventListener('click', function(e) {
        if (e.target === subjectModal) {
            closeSubjectModal();
        }
    });

    chapterModal.addEventListener('click', function(e) {
        if (e.target === chapterModal) {
            closeChapterModal();
        }
    });

    // Attach event listeners
    document.getElementById('viewMindmapBtn').addEventListener('click', openSubjectModal);
});

// ===========================
// SUBJECT SELECTION
// ===========================

function selectSubject(subject, subjectName) {
    mindmapState.selectedSubject = subject;
    mindmapState.selectedSubjectName = subjectName;

    // Load data based on subject
    if (subject === 'cbse-10-science') {
        // Use the globally available CBSE_10_SCIENCE_DATA from cbse-10-science.js
        if (typeof CBSE_10_SCIENCE_DATA !== 'undefined') {
            mindmapState.mindmapData = CBSE_10_SCIENCE_DATA;
            populateChapters();
            closeSubjectModal();
            openChapterModal();
        } else {
            alert('Data loading... Please wait a moment and try again.');
        }
    } else {
        alert('This subject is coming soon!');
    }
}

function populateChapters() {
    const chapterList = document.getElementById('chapterList');
    chapterList.innerHTML = '';

    if (!mindmapState.mindmapData || !mindmapState.mindmapData.chapters) {
        return;
    }

    mindmapState.mindmapData.chapters.forEach(chapter => {
        const button = document.createElement('button');
        button.className = 'chapter-item';
        button.textContent = `${chapter.chapterId}. ${chapter.chapterTitle}`;
        button.onclick = () => selectChapter(chapter.chapterId, chapter.chapterTitle, chapter);
        chapterList.appendChild(button);
    });
}

function selectChapter(chapterId, chapterTitle, chapterData) {
    mindmapState.selectedChapterId = chapterId;
    mindmapState.selectedChapterName = chapterTitle;

    // Update breadcrumb
    document.getElementById('selectedSubjectName').textContent = mindmapState.selectedSubjectName;
    document.getElementById('selectedChapterName').textContent = chapterTitle;

    // Render mindmap
    renderMindmap(chapterData);

    // Show mindmap section
    document.getElementById('mindmapSection').style.display = 'block';
    document.querySelector('.mindmap-hero').style.display = 'none';

    // Close modal and scroll to mindmap
    closeChapterModal();
    setTimeout(() => {
        document.getElementById('mindmapSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Reset expand all button
    mindmapState.allExpanded = false;
    updateExpandAllButton();
}

// ===========================
// MINDMAP RENDERING
// ===========================

function renderMindmap(chapterData) {
    const nodesContainer = document.getElementById('mindmapNodes');
    const svg = document.getElementById('mindmapSvg');

    // Clear previous content
    nodesContainer.innerHTML = '';
    svg.innerHTML = '';

    if (!chapterData.branches) return;

    // Create central node
    const centralNode = document.createElement('div');
    centralNode.className = 'mindmap-node';
    centralNode.style.marginBottom = '30px';

    const centralCard = document.createElement('button');
    centralCard.className = 'node-card level-1';
    centralCard.innerHTML = `
        <span class="node-text">${chapterData.central}</span>
    `;
    centralCard.style.cursor = 'default';
    centralNode.appendChild(centralCard);
    nodesContainer.appendChild(centralNode);

    // Render all branches
    chapterData.branches.forEach((branch, index) => {
        renderBranch(branch, nodesContainer, 0);
    });

    // Draw SVG curves (simplified for now, can be enhanced)
    drawMindmapCurves();

    // Make nodes interactive
    attachNodeInteractions();
}

function renderBranch(branch, container, level) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'mindmap-node';
    nodeWrapper.id = `node-${branch.id}`;

    // Create node card
    const card = document.createElement('button');
    card.className = `node-card level-${branch.level}`;

    // Add arrow if has children
    let arrow = '';
    if (branch.children && branch.children.length > 0) {
        arrow = `<span class="node-arrow">▶</span>`;
    }

    card.innerHTML = `
        ${arrow}
        <span class="node-text">${branch.title}</span>
    `;

    card.onclick = (e) => toggleNodeExpand(branch.id, e);

    nodeWrapper.appendChild(card);

    // Create children container
    let childrenContainer = null;
    if (branch.children && branch.children.length > 0) {
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        childrenContainer.id = `children-${branch.id}`;

        branch.children.forEach(child => {
            renderBranch(child, childrenContainer, level + 1);
        });

        nodeWrapper.appendChild(childrenContainer);
    }

    // Add definition if exists
    if (branch.definition) {
        const defDiv = document.createElement('div');
        defDiv.className = 'node-definition';
        defDiv.innerHTML = `<strong>📌</strong> ${branch.definition}`;
        nodeWrapper.appendChild(defDiv);
    }

    if (branch.description) {
        const descDiv = document.createElement('div');
        descDiv.className = 'node-definition';
        descDiv.innerHTML = `<strong>📝</strong> ${branch.description}`;
        nodeWrapper.appendChild(descDiv);
    }

    container.appendChild(nodeWrapper);
}

function attachNodeInteractions() {
    const nodeCards = document.querySelectorAll('.node-card');

    nodeCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const arrow = this.querySelector('.node-arrow');
            if (arrow && !arrow.classList.contains('hidden')) {
                this.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
}

// ===========================
// EXPAND/COLLAPSE LOGIC
// ===========================

function toggleNodeExpand(nodeId, event) {
    event.stopPropagation();

    const childrenContainer = document.getElementById(`children-${nodeId}`);
    const nodeCard = document.getElementById(`node-${nodeId}`).querySelector('.node-card');
    const arrow = nodeCard.querySelector('.node-arrow');

    if (!childrenContainer) return;

    const isCollapsed = childrenContainer.classList.contains('collapsed');

    if (isCollapsed) {
        childrenContainer.classList.remove('collapsed');
        if (arrow) {
            arrow.classList.add('expanded');
        }
    } else {
        childrenContainer.classList.add('collapsed');
        if (arrow) {
            arrow.classList.remove('expanded');
        }
    }
}

function toggleExpandAll() {
    const allChildContainers = document.querySelectorAll('.node-children');

    if (mindmapState.allExpanded) {
        // Collapse all
        allChildContainers.forEach(container => {
            container.classList.add('collapsed');
            const nodeId = container.id.replace('children-', '');
            const arrow = document.getElementById(`node-${nodeId}`).querySelector('.node-arrow');
            if (arrow) {
                arrow.classList.remove('expanded');
            }
        });
        mindmapState.allExpanded = false;
    } else {
        // Expand all
        allChildContainers.forEach(container => {
            container.classList.remove('collapsed');
            const nodeId = container.id.replace('children-', '');
            const arrow = document.getElementById(`node-${nodeId}`).querySelector('.node-arrow');
            if (arrow) {
                arrow.classList.add('expanded');
            }
        });
        mindmapState.allExpanded = true;
    }

    updateExpandAllButton();
}

function updateExpandAllButton() {
    const btn = document.getElementById('expandAllBtn');
    if (mindmapState.allExpanded) {
        btn.innerHTML = '<span class="btn-icon">⬇️</span><span class="btn-text">Collapse All</span>';
    } else {
        btn.innerHTML = '<span class="btn-icon">⬆️</span><span class="btn-text">Expand All</span>';
    }
}

// ===========================
// SVG CURVE DRAWING (Simplified)
// ===========================

function drawMindmapCurves() {
    const svg = document.getElementById('mindmapSvg');
    const container = document.getElementById('mindmapNodes');

    // This is a simplified version - can be enhanced with more sophisticated curve drawing
    // Current implementation focuses on functional mindmap

    // Set SVG dimensions
    svg.setAttribute('viewBox', `0 0 ${container.offsetWidth} ${container.offsetHeight}`);
    svg.style.width = container.offsetWidth;
    svg.style.height = container.offsetHeight;

    // Optional: Add animated curves between nodes
    // This is a placeholder for future enhancement
}

// ===========================
// NAVIGATION
// ===========================

function goBackToSubjects() {
    // Hide mindmap section
    document.getElementById('mindmapSection').style.display = 'none';
    document.querySelector('.mindmap-hero').style.display = 'block';

    // Reset state
    mindmapState.selectedChapterId = null;
    mindmapState.selectedChapterName = null;

    // Scroll to top
    document.querySelector('.mindmap-hero').scrollIntoView({ behavior: 'smooth' });
}

// ===========================
// PDF EXPORT
// ===========================

function downloadChapterPDF() {
    // Use html2pdf library for PDF generation
    const element = document.getElementById('mindmapSection');

    // Create a clone for printing (desktop layout)
    const clone = element.cloneNode(true);
    clone.style.display = 'block';

    // Create temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>${mindmapState.selectedSubjectName}</h1>
            <h2>Chapter ${mindmapState.selectedChapterId}: ${mindmapState.selectedChapterName}</h2>
            <div style="margin-top: 30px;">
    `;

    // Get all nodes and convert to text format for PDF
    const nodes = document.querySelectorAll('.mindmap-node');
    nodes.forEach(node => {
        const text = node.textContent;
        const level = node.querySelector('.node-card') ? 
                     node.querySelector('.node-card').className.match(/level-\d/)[0] : 'level-1';
        const style = getStyleForLevel(level);
        tempDiv.innerHTML += `<div style="${style}">${text}</div>`;
    });

    tempDiv.innerHTML += '</div>';

    // Trigger print
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(tempDiv.innerHTML);
    printWindow.document.close();
    printWindow.print();
}

function downloadAllChaptersPDF() {
    alert('All chapters PDF download will be available soon. Currently supports single chapter download.');
    // This feature can be enhanced to generate multi-chapter PDFs
}

function getStyleForLevel(level) {
    const styles = {
        'level-1': 'margin: 20px 0 10px 0; font-size: 18px; font-weight: bold; color: #0052CC;',
        'level-2': 'margin: 15px 0 8px 30px; font-size: 15px; font-weight: bold; color: #0066FF;',
        'level-3': 'margin: 10px 0 5px 60px; font-size: 13px; color: #3D7FFF;',
        'level-4': 'margin: 8px 0 4px 90px; font-size: 12px; color: #6BA3FF;'
    };
    return styles[level] || styles['level-1'];
}

// ===========================
// ESCAPE KEY HANDLER
// ===========================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const subjectModal = document.getElementById('subjectModal');
        const chapterModal = document.getElementById('chapterModal');

        if (subjectModal.classList.contains('active')) {
            closeSubjectModal();
        }
        if (chapterModal.classList.contains('active')) {
            closeChapterModal();
        }
    }
});

console.log('Mindmap.js loaded successfully');
