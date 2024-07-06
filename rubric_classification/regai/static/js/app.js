// function getCSRFToken() {
//     const cookies = document.cookie.split(';');
//     for (let cookie of cookies) {
//         const [name, value] = cookie.trim().split('=');
//         if (name === 'csrftoken') {
//             return value;
//         }
//     }
//     return null;
// }

window.createAssignmentForm = createAssignmentForm;

document.addEventListener('alpine:init', () => {
    Alpine.data('modalData', () => ({
        open: false,
        content: '',
        init() {
            this.$watch('open', value => {
                if (value === true) {
                    document.body.classList.add('overflow-hidden');
                } else {
                    document.body.classList.remove('overflow-hidden');
                }
            });
        },
        openModal(modalContent) {
            this.content = modalContent;
            this.open = true;
        },
        closeModal() {
            this.open = false;
        }
    }));
});

// Use event delegation for the create assignment button
document.addEventListener('click', function(event) {
    if (event.target.matches('[data-modal="create-assignment"]')) {
        const modalContent = window.createAssignmentForm();
        window.dispatchEvent(new CustomEvent('open-modal', { detail: modalContent }));
    }
});

function createAssignmentForm() {
    return `
        <h2 class="text-2xl font-bold mb-4">Create New Assignment</h2>
        <form id="createAssignmentForm">
            <div class="mb-4">
                <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" id="title" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
            </div>
            <div class="mb-4">
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" rows="3" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"></textarea>
            </div>
            <div class="mt-6">
                <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Create Assignment and Generate Rubric
                </button>
            </div>
        </form>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    // Listen for the custom event that opens the modal
    window.addEventListener('open-modal', function(event) {
        // Wait for the modal content to be rendered
        setTimeout(() => {
            const createAssignmentForm = document.getElementById('createAssignmentForm');
            if (createAssignmentForm) {
                createAssignmentForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    createAssignment(this);
                });
            }
        }, 100);
    });
});

// function renderSubmissionCard(submission) {
//     return `
//     <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg submission-card" data-submission-id="${submission.id}">
//         <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
//             <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Submission ${submission.id}</h3>
//             <span class="text-sm text-gray-500 dark:text-gray-400">${new Date(submission.submitted_at).toLocaleString()}</span>
//         </div>
//         <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
//             <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">File: <a href="${submission.file}" class="text-blue-600 hover:underline" target="_blank">Download</a></p>
//             <div class="grade-section ${submission.grade ? 'graded' : ''}">
//                 ${submission.grade ?
//                     `<p class="mb-2 text-gray-700 dark:text-gray-300">Grade: <span class="font-semibold text-green-600 dark:text-green-400">${submission.grade}</span></p>
//                     <button onclick="toggleFeedback(this)" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none transition duration-150 ease-in-out flex items-center text-sm">
//                         <span>Show Feedback</span>
//                         <svg class="w-4 h-4 ml-2 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
//                     </button>
//                     <div class="hidden mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-md feedback-content">
//                         <h4 class="font-semibold mb-2 text-gray-800 dark:text-gray-200">Feedback:</h4>
//                         <p class="text-sm text-gray-600 dark:text-gray-400">${submission.feedback.overall_score_justification}</p>
//                         <h5 class="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Category Scores:</h5>
//                         ${submission.feedback.category_scores.map(category => `
//                             <div class="mb-2">
//                                 <p class="text-sm"><strong class="text-gray-700 dark:text-gray-300">${category.category}:</strong> <span class="text-gray-600 dark:text-gray-400">${category.justification}</span></p>
//                             </div>
//                         `).join('')}
//                     </div>`
//                     :
//                     `<button onclick="gradeSubmission(${submission.id})" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
//                         Grade Submission
//                     </button>`
//                 }
//             </div>
//         </div>
//     </div>
//     `;
// }
document.addEventListener('DOMContentLoaded', function() {
    const createAssignmentButton = document.querySelector('[data-modal="create-assignment"]');
    const modal = document.querySelector('[x-data="{ open: false }"]');

    createAssignmentButton.addEventListener('click', function() {
        modal.__x.$data.open = true;
    });

    const createAssignmentForm = document.getElementById('createAssignmentForm');
    createAssignmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createAssignment(this);
    });
});

function createAssignment(form) {
    const formData = new FormData(form);

    showLoadingScreen();

    fetch('/assignments/create_assignment/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingScreen();
        if (data.id && data.rubric) {
            showNotification('Assignment created successfully!');
            showRubricEditor(data.id, data.rubric);
        } else {
            showNotification('Error creating assignment. Please try again.', 'error');
        }
    })
    .catch(error => {
        hideLoadingScreen();
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

// function showRubricEditor(assignmentId, rubric) {
//     const rubricHtml = `
//         <h2 class="text-2xl font-bold mb-4">Edit Rubric</h2>
//         <form id="editRubricForm" data-assignment-id="${assignmentId}">
//             <div id="rubricContainer">
//                 ${generateRubricHtml(rubric)}
//             </div>
//             <div class="mt-6">
//                 <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
//                     Save Rubric
//                 </button>
//             </div>
//         </form>
//     `;
//
//     // Update modal content
//     window.dispatchEvent(new CustomEvent('open-modal', { detail: rubricHtml }));
// }

// function generateRubricHtml(rubric) {
//     let html = '';
//     for (let i = 0; i < rubric.length; i++) {
//         html += `
//             <div class="mb-4 p-4 border rounded rubric-category" data-index="${i}">
//                 <div class="flex justify-between items-center mb-2">
//                     <label class="block text-lg font-medium text-gray-700">Category ${i + 1}</label>
//                     <button type="button" class="text-red-600 hover:text-red-800" onclick="removeCategory(${i})">Remove</button>
//                 </div>
//                 <input type="text" name="category_${i}" value="${rubric[i].category}" placeholder="Category Name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
//                 <div class="mt-2">
//                     <label class="block text-sm font-medium text-gray-700">Weight (%)</label>
//                     <input type="number" name="weight_${i}" value="${rubric[i].weight}" min="0" max="100" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
//                 </div>
//                 <div class="mt-4">
//                     <label class="block text-sm font-medium text-gray-700">Scoring Levels</label>
//                     <div id="scoringLevels_${i}">
//                         ${generateScoringLevelsHtml(rubric[i].scoring_levels, i)}
//                     </div>
//                     <button type="button" class="mt-2 text-blue-600 hover:text-blue-800" onclick="addScoringLevel(${i})">Add Scoring Level</button>
//                 </div>
//             </div>
//         `;
//     }
//     return html;
// }

// function generateScoringLevelsHtml(scoringLevels, categoryIndex) {
//     let html = '';
//     for (let j = 0; j < scoringLevels.length; j++) {
//         html += `
//             <div class="mt-2 p-2 border rounded scoring-level" data-index="${j}">
//                 <div class="flex justify-between items-center mb-2">
//                     <label class="block text-sm font-medium text-gray-700">Level ${j + 1}</label>
//                     <button type="button" class="text-red-600 hover:text-red-800" onclick="removeScoringLevel(${categoryIndex}, ${j})">Remove</button>
//                 </div>
//                 <input type="text" name="level_name_${categoryIndex}_${j}" value="${scoringLevels[j].name}" placeholder="Level Name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
//                 <input type="number" name="level_score_${categoryIndex}_${j}" value="${scoringLevels[j].score}" placeholder="Score" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
//                 <textarea name="level_description_${categoryIndex}_${j}" placeholder="Description" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">${scoringLevels[j].description}</textarea>
//             </div>
//         `;
//     }
//     return html;
// }

function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    loadingScreen.innerHTML = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div class="p-8 bg-white shadow-lg rounded-md">
                <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
                <p class="text-center text-gray-700 mt-4">Loading...</p>
            </div>
        </div>
    `;
    document.body.appendChild(loadingScreen);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.remove();
    }
}
//
// function addCategory() {
//     const rubricContainer = document.getElementById('rubricContainer');
//     const categoryCount = rubricContainer.querySelectorAll('.rubric-category').length;
//     const newCategory = {
//         category: '',
//         weight: 0,
//         scoring_levels: [
//             { name: 'Poor', score: 0, description: '' },
//             { name: 'Good', score: 1, description: '' }
//         ]
//     };
//     const newCategoryHtml = generateRubricHtml([newCategory]).replace(/\${i}/g, categoryCount);
//     rubricContainer.insertAdjacentHTML('beforeend', newCategoryHtml);
// }
//
// function removeCategory(index) {
//     const category = document.querySelector(`.rubric-category[data-index="${index}"]`);
//     category.remove();
//     updateCategoryIndices();
// }
//
// function addScoringLevel(categoryIndex) {
//     const scoringLevelsContainer = document.getElementById(`scoringLevels_${categoryIndex}`);
//     const levelCount = scoringLevelsContainer.querySelectorAll('.scoring-level').length;
//     const newLevel = { name: '', score: 0, description: '' };
//     const newLevelHtml = generateScoringLevelsHtml([newLevel], categoryIndex).replace(/\${j}/g, levelCount);
//     scoringLevelsContainer.insertAdjacentHTML('beforeend', newLevelHtml);
// }

function removeScoringLevel(categoryIndex, levelIndex) {
    const level = document.querySelector(`#scoringLevels_${categoryIndex} .scoring-level[data-index="${levelIndex}"]`);
    level.remove();
    updateScoringLevelIndices(categoryIndex);
}
//
// function updateCategoryIndices() {
//     const categories = document.querySelectorAll('.rubric-category');
//     categories.forEach((category, index) => {
//         category.dataset.index = index;
//         category.querySelector('label').textContent = `Category ${index + 1}`;
//         updateScoringLevelIndices(index);
//     });
// }

function updateScoringLevelIndices(categoryIndex) {
    const levels = document.querySelectorAll(`#scoringLevels_${categoryIndex} .scoring-level`);
    levels.forEach((level, index) => {
        level.dataset.index = index;
        level.querySelector('label').textContent = `Level ${index + 1}`;
    });
}

document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'createAssignmentForm') {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        // Show loading screen
        showLoadingScreen();

        fetch('/assignments/create_assignment/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                });
            }
            return response.json();
        })
            .then(data => {
            hideLoadingScreen();
            if (data.id && data.rubric) {
                showRubricEditor(data.id, data.rubric);
            } else {
                showNotification('Error creating assignment. Please try again.', 'error');
            }
        })
        .catch(error => {
            hideLoadingScreen();
            console.error('Error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        });
    }
});

function gradeSubmission(submissionId) {
    showLoadingScreen();
    fetch(`/submissions/${submissionId}/grade_submission/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingScreen();
        if (data.grade !== undefined && data.feedback) {
            showNotification(`Submission graded. Score: ${data.grade}`);
            updateSubmissionDisplay(data);
        } else {
            showNotification('Error grading submission. Please try again.', 'error');
        }
    })
    .catch(error => {
        hideLoadingScreen();
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

function updateSubmissionDisplay(submission) {
    const submissionCard = document.querySelector(`.submission-card[data-submission-id="${submission.id}"]`);
    if (submissionCard) {
        const gradeSection = submissionCard.querySelector('.grade-section');
        gradeSection.innerHTML = `
            <p class="mb-2">Grade: <span class="font-semibold">${submission.grade}</span></p>
            <button class="text-blue-600 hover:underline toggle-feedback-btn">Toggle Feedback</button>
            <div class="feedback-content hidden mt-4">
                <h4 class="font-semibold mb-2">Feedback:</h4>
                <p>${submission.feedback.overall_score_justification}</p>
                <h5 class="font-semibold mt-2 mb-1">Category Scores:</h5>
                ${submission.feedback.category_scores.map(category => `
                    <div class="mb-2">
                        <p><strong>${category.category}:</strong> ${category.justification}</p>
                    </div>
                `).join('')}
            </div>
        `;
        gradeSection.classList.add('graded');

        const toggleBtn = gradeSection.querySelector('.toggle-feedback-btn');
        toggleBtn.addEventListener('click', function() {
            const feedbackContent = gradeSection.querySelector('.feedback-content');
            feedbackContent.classList.toggle('hidden');
        });
    }
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('grade-submission-btn')) {
        const submissionId = e.target.dataset.submissionId;
        gradeSubmission(submissionId);
    }

    if (e.target && e.target.classList.contains('toggle-feedback-btn')) {
        const feedbackContent = e.target.nextElementSibling;
        feedbackContent.classList.toggle('hidden');
    }
});


// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }
document.addEventListener('DOMContentLoaded', function() {
    // Delete assignment functionality
    document.body.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('delete-assignment-btn')) {
            const assignmentId = e.target.dataset.assignmentId;
            if (confirm('Are you sure you want to delete this assignment?')) {
                deleteAssignment(assignmentId);
            }
        }
    });

    // Rubric category edit functionality
    const rubricContainer = document.getElementById('rubricContainer');
    if (rubricContainer) {
        rubricContainer.addEventListener('click', function(e) {
            const categoryRow = e.target.closest('.rubric-category');
            if (categoryRow) {
                const categoryIndex = categoryRow.dataset.categoryIndex;
                showEditOverlay(categoryIndex);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const rubricContainer = document.getElementById('rubricContainer');
    const rubricShadow = document.getElementById('rubricShadow');

    if (rubricContainer && rubricShadow) {
        rubricContainer.addEventListener('click', function(e) {
            const categoryRow = e.target.closest('.rubric-category');
            if (categoryRow) {
                // Remove highlight from all rows
                rubricContainer.querySelectorAll('.rubric-category').forEach(row => {
                    row.classList.remove('z-10', 'relative');
                });

                // Highlight the clicked row
                categoryRow.classList.add('z-10', 'relative');

                // Show the shadow
                rubricShadow.classList.remove('hidden');

                // Position the shadow to cover everything except the clicked row
                const rowRect = categoryRow.getBoundingClientRect();
                const containerRect = rubricContainer.getBoundingClientRect();

                rubricShadow.style.top = `${rowRect.top - containerRect.top}px`;
                rubricShadow.style.height = `${rowRect.height}px`;

                // Add click event to the shadow to remove highlighting
                rubricShadow.onclick = function() {
                    categoryRow.classList.remove('z-10', 'relative');
                    rubricShadow.classList.add('hidden');
                };
            }
        });
    }
});

function deleteAssignment(assignmentId) {
    fetch(`/assignments/${assignmentId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const assignmentCard = document.querySelector(`[data-assignment-id="${assignmentId}"]`).closest('.bg-white');
            assignmentCard.remove();
            showNotification('Assignment deleted successfully');
        } else {
            showNotification('Error deleting assignment', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while deleting the assignment', 'error');
    });
}
document.addEventListener('alpine:init', () => {
    Alpine.data('rubricEditor', () => ({
        assignment: JSON.parse(document.getElementById('rubricData').textContent),
        editingCategory: null,

        saveCategory(categoryIndex) {
            // Implement the logic to save the edited category
            // This should update the rubric data and send it to the server
            updateRubric(this.assignment.rubric).then(() => {
                this.editingCategory = null;
                // Optionally, show a success notification
                showNotification('Category updated successfully', 'success');
            }).catch(error => {
                console.error('Error updating category:', error);
                showNotification('Failed to update category', 'error');
            });
        }
    }));
});

function updateRubric(rubric) {
    const assignmentId = document.querySelector('[data-assignment-id]').dataset.assignmentId;
    return fetch(`/assignments/${assignmentId}/update-rubric/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ rubric: rubric })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            return Promise.resolve();
        } else {
            return Promise.reject('Server returned an error');
        }
    });
}

// function showNotification(message, type = 'success') {
//     // Implement this function to show notifications to the user
//     console.log(`${type}: ${message}`);
//     // You can use a library like toastr or create a custom notification system
// }
function showEditOverlay(categoryIndex) {
    const rubric = JSON.parse(document.getElementById('rubricData').textContent);
    const category = rubric[categoryIndex];
    const overlay = document.getElementById('editOverlay');
    const content = document.getElementById('editContent');

    content.innerHTML = `
        <h3 class="text-2xl font-bold mb-4">Edit Category</h3>
        <form id="editCategoryForm" data-category-index="${categoryIndex}">
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="category">
                    Category Name
                </label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="category" type="text" value="${category.category}">
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2" for="weight">
                    Weight
                </label>
                <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="weight" type="number" value="${category.weight}">
            </div>
            <div id="scoringLevels">
                ${category.scoring_levels.map((level, i) => `
                    <div class="mb-4">
                        <h5 class="font-bold">Scoring Level ${i + 1}</h5>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" type="text" value="${level.name}" placeholder="Level Name">
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2" type="number" value="${level.score}" placeholder="Score">
                        <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Description">${level.description}</textarea>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-between">
                <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    Save Changes
                </button>
                <button type="button" id="cancelEdit" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    Cancel
                </button>
            </div>
        </form>
    `;

    overlay.classList.remove('hidden');

    document.getElementById('editCategoryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCategory(this);
    });

    document.getElementById('cancelEdit').addEventListener('click', function() {
        overlay.classList.add('hidden');
    });
}

// function saveCategory(form) {
//     const categoryIndex = form.dataset.categoryIndex;
//     const rubric = JSON.parse(document.getElementById('rubricData').textContent);
//
//     rubric[categoryIndex] = {
//         category: form.querySelector('#category').value,
//         weight: parseInt(form.querySelector('#weight').value),
//         scoring_levels: Array.from(form.querySelectorAll('#scoringLevels > div')).map(div => ({
//             name: div.querySelector('input[type="text"]').value,
//             score: parseInt(div.querySelector('input[type="number"]').value),
//             description: div.querySelector('textarea').value
//         }))
//     };
//
//     updateRubric(rubric);
// }

// function updateRubric(rubric) {
//     const assignmentId = document.querySelector('[data-assignment-id]').dataset.assignmentId;
//     fetch(`/assignments/${assignmentId}/update-rubric/`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': getCookie('csrftoken')
//         },
//         body: JSON.stringify({ rubric: rubric })
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             document.getElementById('editOverlay').classList.add('hidden');
//             document.getElementById('rubricData').textContent = JSON.stringify(rubric);
//             updateRubricDisplay(rubric);
//             showNotification('Rubric updated successfully');
//         } else {
//             showNotification('Error updating rubric', 'error');
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         showNotification('An error occurred while updating the rubric', 'error');
//     });
// }

// function updateRubricDisplay(rubric) {
//     const rubricContainer = document.getElementById('rubricContainer');
//     if (rubricContainer) {
//         rubricContainer.innerHTML = generateRubricHtml(rubric);
//     }
// }

function generateRubricHtml(rubric) {
    return `
        <table class="w-full border-collapse border border-gray-300">
            <thead>
                <tr>
                    <th class="border border-gray-300 p-2">Category (Weight)</th>
                    ${rubric[0].scoring_levels.map(level => `<th class="border border-gray-300 p-2">${level.name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rubric.map((category, index) => `
                    <tr class="rubric-category" data-category-index="${index}">
                        <td class="border border-gray-300 p-2">
                            ${category.category} (${category.weight}%)
                        </td>
                        ${category.scoring_levels.map(level => `
                            <td class="border border-gray-300 p-2">
                                <p class="font-bold">${level.score}</p>
                                <p>${level.description}</p>
                            </td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function saveCategory(categoryIndex) {
    // Implement the logic to save the edited category
    // This should update the rubric data and send it to the server
    // After saving, hide the overlay and update the rubric display
    // Example:
    // updateRubric(updatedRubric).then(() => {
    //     document.getElementById('editOverlay').classList.add('hidden');
    //     updateRubricDisplay();
    // });
}

// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }

// function showNotification(message, type = 'success') {
//     // Implement this function to show notifications to the user
//     console.log(`${type}: ${message}`);
//     // You can use a library like toastr or create a custom notification system
// }
function showRubricEditor(assignmentId, rubric) {
    const content = `
        <h2 class="text-2xl font-bold mb-4">Edit Rubric</h2>
        <form id="editRubricForm" data-assignment-id="${assignmentId}">
            <div id="rubricContainer">
                ${generateRubricHtml(rubric)}
            </div>
            <div class="mt-6">
                <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Save Rubric
                </button>
            </div>
        </form>
    `;

    // Update modal content
    window.dispatchEvent(new CustomEvent('open-modal', { detail: content }));
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `fixed bottom-4 right-4 p-4 rounded-md ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// function closeModal() {
//     window.dispatchEvent(new CustomEvent('close-modal'));
// }