document.addEventListener('DOMContentLoaded', function() {
    const rubric = JSON.parse(document.getElementById('rubricData').textContent);
    let currentCategoryIndex = 0;

    function showApprovalOverlay(category) {
        const overlay = document.getElementById('rubricApprovalOverlay');
        const content = document.getElementById('approvalContent');

        content.innerHTML = `
            <h3 class="text-2xl font-bold mb-4">Approve Evaluation Criteria</h3>
            <h4 class="text-xl mb-2">${category.category} (Weight: ${category.weight}%)</h4>
            <table class="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                    <tr>
                        ${category.scoring_levels.map(level => `<th class="border border-gray-300 p-2">${level.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${category.scoring_levels.map(level => `
                            <td class="border border-gray-300 p-2">
                                <p class="font-bold">${level.score}</p>
                                <p>${level.description}</p>
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
            <button id="approveButton" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Approve
            </button>
            <button id="editButton" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded ml-2">
                Edit
            </button>
        `;

        overlay.classList.remove('hidden');

        document.getElementById('approveButton').addEventListener('click', function() {
            currentCategoryIndex++;
            if (currentCategoryIndex < rubric.length) {
                showApprovalOverlay(rubric[currentCategoryIndex]);
            } else {
                overlay.classList.add('hidden');
                // All categories approved, you might want to send this information to the server
                updateRubric(rubric);
            }
        });

        document.getElementById('editButton').addEventListener('click', function() {
            showEditForm(category, currentCategoryIndex);
        });
    }

    function showEditForm(category, index) {
        const content = document.getElementById('approvalContent');

        content.innerHTML = `
            <h3 class="text-2xl font-bold mb-4">Edit Category</h3>
            <form id="editCategoryForm">
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
                <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    Save Changes
                </button>
            </form>
        `;

        document.getElementById('editCategoryForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const updatedCategory = {
                category: document.getElementById('category').value,
                weight: parseInt(document.getElementById('weight').value),
                scoring_levels: Array.from(document.getElementById('scoringLevels').children).map(div => ({
                    name: div.querySelector('input[type="text"]').value,
                    score: parseInt(div.querySelector('input[type="number"]').value),
                    description: div.querySelector('textarea').value
                }))
            };
            rubric[index] = updatedCategory;
            showApprovalOverlay(updatedCategory);
        });
    }

    function updateRubric(rubric) {
        fetch(`/assignment/${assignmentId}/update-rubric/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ rubric: rubric })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'Rubric updated') {
                showNotification('Rubric updated successfully');
            } else {
                showNotification('Error updating rubric', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('An error occurred while updating the rubric', 'error');
        });
    }

    // Start the approval process
    if (rubric.length > 0) {
        showApprovalOverlay(rubric[0]);
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showNotification(message, type = 'success') {
    // Implement this function to show notifications to the user
}