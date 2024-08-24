import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ExclamationIcon, XCircleIcon, PencilIcon, EyeIcon } from '@heroicons/react/solid';
import GradeModal from "./GradeModal";
import CritiqueModal from "./CritiqueModal";
import { approveKnowledgeBaseItem } from "../utils/knowledgeBaseApi";
import {toast} from "react-toastify";

const EMOJIS = {
  submission: '📝',
  initial: '🔎',
  critique: '💬',
  revision: '✏️',
  final: '🏆',
};

const COLORS = {
  submission: 'bg-blue-50 border-blue-200',
  initial: 'bg-green-50 border-green-200',
  critique: 'bg-purple-50 border-purple-200',
  revision: 'bg-orange-50 border-orange-200',
  final: 'bg-red-50 border-red-200',
};

const STATUS_COLORS = {
  PASS: 'bg-green-100 text-green-800',
  MINOR_REVISION: 'bg-yellow-100 text-yellow-800',
  MAJOR_REVISION: 'bg-red-100 text-red-800',
};

const STATUS_ICONS = {
  PASS: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  MINOR_REVISION: <ExclamationIcon className="w-5 h-5 text-yellow-500" />,
  MAJOR_REVISION: <XCircleIcon className="w-5 h-5 text-red-500" />,
};

const SequentialItem = ({ item, onClick, isActive, onApprove, rubric }) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderSubtext = () => {
  switch (item.type) {
    case 'initial':
    case 'revision':
    case 'final':
      const maxScore = rubric?.content?.categories?.[0]?.scoring_levels?.length || 6;
      const score = item.content?.scores?.[0]?.score || 0;
      return `Score: ${score}/${maxScore}`;
    case 'critique':
      return item.content?.overall_assessment
        ? item.content.overall_assessment.substr(0, 100) + '...'
        : 'No assessment provided';
    default:
      return null;
  }
};

  return (
    <motion.div
      className={`${COLORS[item.type]} p-4 rounded-lg shadow-md mb-4 cursor-pointer transition-all duration-300 ${isActive ? 'ring-2 ring-blue-400' : ''}`}
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{EMOJIS[item.type]}</span>
          <h3 className="text-lg font-semibold">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</h3>
        </div>
        {item.type === 'critique' && (
          <div className={`${STATUS_COLORS[item.content.revision_status]} px-2 py-1 rounded-full text-xs font-semibold flex items-center`}>
            {STATUS_ICONS[item.content.revision_status]}
            <span className="ml-1">{item.content.revision_status}</span>
          </div>
        )}
      </div>
      {(isActive || isHovered) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 text-sm"
        >
          {renderSubtext()}
        </motion.div>
      )}
      <div className="mt-2 flex justify-end space-x-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            onClick(item);
          }}
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          View
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            onClick(item, true);
          }}
        >
          <PencilIcon className="w-4 h-4 mr-1" />
          Edit
        </motion.button>
        {!item.human_approved && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              if ('revision_status' in item){
                onApprove('critique', item)
              }
              else{
                onApprove('grade', item)
              }
            }}
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approve
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const SubmissionModal = ({ submission, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0.9 }}
      className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
      onClick={e => e.stopPropagation()}
    >
      <h3 className="text-xl font-bold mb-4">Submission Content (ID: {submission.id})</h3>
      <p className="whitespace-pre-wrap">{submission.content}</p>
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={onClose}
      >
        Close
      </button>
    </motion.div>
  </motion.div>
);

const SubmissionGradingCard = ({ submission, rubric, isExpanded, onToggleExpand, onUpdate }) => {
  const [modalState, setModalState] = useState({ isOpen: false, type: null, item: null, isEditing: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [localSubmission, setLocalSubmission] = useState(submission);

  const cycle = useMemo(() => {
  if (!submission?.knowledge_base_items) return [];
  const { critiques = [], final_grade = null } = submission.knowledge_base_items || {};

    console.log(critiques)
    console.log(final_grade)
  const cycleItems = [
    { type: 'submission', content: submission?.content, id: submission?.id },
  ];

  // Add critiques and their associated grades
  critiques.forEach((critique, index) => {
     if (index === 0 && critique.grade) {
      // The first grade is the initial grade
      cycleItems.push({ type: critique?.grade?.type, ...critique?.grade });
    }
    cycleItems.push({ type: 'critique', ...critique });
    if (index < critiques.length - 1 && critique.grade) {
      // For all but the last critique, add a revision grade
      cycleItems.push({ type: 'revision', ...critique.grade });
    }
  });

  //  Add final grade
  if (final_grade) {
    cycleItems.push({ type: 'final', ...final_grade });
  }

  return cycleItems;
}, [submission]);

  const handleViewItem = (item, isEditing = false) => {
    if (item.type === 'submission') {
      setShowSubmissionModal(true);
    } else {
      setModalState({ isOpen: true, type: item.type, item: item, isEditing });
    }
    setActiveIndex(cycle.findIndex(i => i.type === item.type));
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: null, item: null, isEditing: false });
  };

  const handleApproveItem = async (itemType, item) => {
    try {
      const updatedItem = await approveKnowledgeBaseItem(itemType, item);
      setLocalSubmission(prevSubmission => ({
        ...prevSubmission,
        knowledge_base_items: {
          ...prevSubmission.knowledge_base_items,
          [itemType]: {
            ...prevSubmission.knowledge_base_items[itemType],
            ...updatedItem,
            human_approved: true
          }
        }
      }));
      onUpdate(localSubmission);
      toast.success("Item Successfully Approved");
    } catch (error) {
      console.error(`Error approving ${itemType}:`, error);
    }
  };

  const renderModal = () => {
    const { isOpen, type, item, isEditing } = modalState;
    if (!isOpen || !item) return null;

    const commonProps = {
      onClose: handleCloseModal,
      onUpdate: (itemType, updatedData) => {
        if (!(itemType === 'critique')){
          approveKnowledgeBaseItem(itemType, item);
        }

        onUpdate({ ...item, content: updatedData, human_approved: true });
        handleCloseModal();
      },
      isEditing,
    };

    switch (type) {
      case 'initial':
      case 'revision':
      case 'final':
        return <GradeModal grade={item} gradeType={type} rubric={rubric} {...commonProps} />;
      case 'critique':
        return <CritiqueModal critique={item} {...commonProps} />;
      default:
        return null;
    }
  };

  const getFinalGrade = useMemo(() => {
    const finalGrade = submission?.knowledge_base_items?.final_grade?.[0] ||
                       submission?.knowledge_base_items?.grades?.[submission?.knowledge_base_items?.grades?.length - 1];
    if (!finalGrade?.content?.scores?.[0]?.score) return null;
    const maxScore = rubric?.content?.categories?.[0]?.scoring_levels?.length || 6;
    const score = parseFloat(finalGrade.content.scores[0].score);
    const percentage = Math.round((score / maxScore) * 100);
    return (
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
          {percentage}%
        </div>
      </div>
    );
  }, [submission, rubric]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white shadow-lg rounded-lg p-6 mb-6 w-full transition-all duration-300 hover:shadow-xl"
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {submission?.student_name || 'Unknown Student'}'s Submission (ID: {submission?.id})
          </h3>
          <p className="text-sm text-gray-500">
            Submitted: {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {getFinalGrade}
          {isExpanded ? (
            <ChevronUpIcon className="w-6 h-6 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {cycle.map((item, index) => (
              <SequentialItem
                key={index}
                item={item}
                onClick={handleViewItem}
                isActive={index === activeIndex}
                onApprove={handleApproveItem}
                rubric={rubric}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalState.isOpen && renderModal()}
        {showSubmissionModal && (
          <SubmissionModal
            submission={submission}
            onClose={() => setShowSubmissionModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};


SubmissionGradingCard.propTypes = {
  submission: PropTypes.shape({
    student_name: PropTypes.string,
    submitted_at: PropTypes.string,
    content: PropTypes.string,
    knowledge_base_items: PropTypes.shape({
      grades: PropTypes.array,
      critiques: PropTypes.array,
      final_grade: PropTypes.array,
    }),
  }),
  rubric: PropTypes.shape({
    content: PropTypes.shape({
      categories: PropTypes.arrayOf(PropTypes.shape({
        scoring_levels: PropTypes.array,
      })),
    }),
  }),
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default SubmissionGradingCard;