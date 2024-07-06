import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RubricEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rubric, setRubric] = useState([]);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  useEffect(() => {
    fetchRubric();
  }, [id]);

  const fetchRubric = () => {
    axios.get(`/api/assignments/${id}/`)
      .then(response => {
        setRubric(response.data.rubric);
        setIsAIGenerated(response.data.is_ai_generated_rubric);
      })
      .catch(error => console.error('Error fetching rubric:', error));
  };

  const handleSave = () => {
    axios.post(`/api/assignments/${id}/update_rubric/`, { rubric })
      .then(() => {
        alert('Rubric saved successfully');
        navigate(`/assignment/${id}`);
      })
      .catch(error => console.error('Error saving rubric:', error));
  };

  const addCategory = () => {
    setRubric([...rubric, {
      category: 'New Category',
      weight: 0,
      scoring_levels: [
        { name: 'Poor', score: 0, description: '' },
        { name: 'Good', score: 1, description: '' }
      ]
    }]);
  };

  const addScoringLevel = (categoryIndex) => {
    const newRubric = [...rubric];
    newRubric[categoryIndex].scoring_levels.push({
      name: 'New Level',
      score: newRubric[categoryIndex].scoring_levels.length,
      description: ''
    });
    setRubric(newRubric);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Rubric</h1>
      {isAIGenerated && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6" role="alert">
          <p>This rubric was initially generated by AI. Please review and adjust as needed.</p>
        </div>
      )}
      {rubric.map((category, index) => (
        <div key={index} className="mb-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-xl font-semibold">
              <input
                type="text"
                value={category.category}
                onChange={(e) => {
                  const newRubric = [...rubric];
                  newRubric[index].category = e.target.value;
                  setRubric(newRubric);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </h2>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">Weight (%)</label>
              <input
                type="number"
                value={category.weight}
                onChange={(e) => {
                  const newRubric = [...rubric];
                  newRubric[index].weight = parseInt(e.target.value);
                  setRubric(newRubric);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              {category.scoring_levels.map((level, levelIndex) => (
                <div key={levelIndex} className={levelIndex % 2 === 0 ? 'bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6' : 'bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'}>
                  <dt className="text-sm font-medium text-gray-500">
                    <input
                      type="text"
                      value={level.name}
                      onChange={(e) => {
                        const newRubric = [...rubric];
                        newRubric[index].scoring_levels[levelIndex].name = e.target.value;
                        setRubric(newRubric);
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Score</label>
                      <input
                        type="number"
                        value={level.score}
                        onChange={(e) => {
                          const newRubric = [...rubric];
                          newRubric[index].scoring_levels[levelIndex].score = parseInt(e.target.value);
                          setRubric(newRubric);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={level.description}
                        onChange={(e) => {
                          const newRubric = [...rubric];
                          newRubric[index].scoring_levels[levelIndex].description = e.target.value;
                          setRubric(newRubric);
                        }}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button onClick={() => addScoringLevel(index)} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add Scoring Level
            </button>
          </div>
        </div>
      ))}
      <div className="mt-4 flex justify-between">
        <button onClick={addCategory} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Add Category
        </button>
        <button onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Save Rubric
        </button>
      </div>
    </div>
  );
}

export default RubricEditor;