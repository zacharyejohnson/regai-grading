// import React from 'react';
// import { motion } from 'framer-motion';
//
// function RubricApprovalBanner({ onApprove }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: -50 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="bg-yellow-100 border-2 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg shadow-md"
//     >
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="font-bold">Rubric Needs Approval</p>
//           <p>Please review and approve the rubric before proceeding.</p>
//         </div>
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={onApprove}
//           className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
//         >
//           Approve Rubric
//         </motion.button>
//       </div>
//     </motion.div>
//   );
// }
//
// export default RubricApprovalBanner;