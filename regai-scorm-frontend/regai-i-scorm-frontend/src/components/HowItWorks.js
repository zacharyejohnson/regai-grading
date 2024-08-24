import React from 'react';

const HowItWorks = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">How It Works: REGAI Experimental Grading System</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Welcome to REGAI</h2>
        <p className="mb-4">
          REGAI (Rubric Enabled Generative Artificial Intelligence) is an innovative, experimental grading system designed to provide fair, consistent, and detailed feedback on your assignments. This cutting-edge technology combines the power of large language models with human expertise to evaluate your work.
        </p>
        <p className="mb-4">
          <strong>Important Note:</strong> REGAI is currently in an experimental phase. While it aims to provide accurate and helpful feedback, the system is still being refined and improved. Your participation and feedback are crucial in helping us enhance this technology.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How REGAI Works</h2>
        <p className="mb-4">REGAI uses a sophisticated multi-step process to evaluate your assignments:</p>
        <ol className="list-decimal list-inside mb-4">
          <li className="mb-2">Rubric Creation: Your instructor creates a detailed rubric for the assignment.</li>
          <li className="mb-2">Initial Scoring: An AI model evaluates your submission based on the rubric.</li>
          <li className="mb-2">Critique Cycle: Another AI model reviews the initial score, providing feedback and suggestions for improvement.</li>
          <li className="mb-2">Refinement: The scoring is refined based on the critique.</li>
          <li className="mb-2">Final Review: The process may involve multiple rounds of critique and refinement to ensure accuracy.</li>
        </ol>
        <p>This iterative process aims to mimic the thoughtful evaluation process of an experienced human grader.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What You Need to Do</h2>
        <p className="mb-4">As a student using REGAI, here's what you need to know:</p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">Submit your assignments as usual through the provided platform.</li>
          <li className="mb-2">Your work will be automatically processed by REGAI.</li>
          <li className="mb-2">You'll receive a detailed breakdown of your score, including specific feedback for each rubric category.</li>
          <li className="mb-2">Review the feedback carefully. It's designed to help you understand your strengths and areas for improvement.</li>
          <li className="mb-2">If you have questions about your score, you can request a review from your instructor.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Benefits of REGAI</h2>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">Consistent Grading: Every submission is evaluated using the same criteria and process.</li>
          <li className="mb-2">Detailed Feedback: You receive specific comments on various aspects of your work.</li>
          <li className="mb-2">Quick Turnaround: The automated system can provide faster results compared to traditional grading methods.</li>
          <li className="mb-2">Learning Opportunity: The detailed feedback can help you understand the expectations and improve your future work.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Important Considerations</h2>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">REGAI is an AI-based system and may not capture every nuance that a human grader would.</li>
          <li className="mb-2">Your instructors are still involved in the process and can review and adjust grades if necessary.</li>
          <li className="mb-2">The system is designed to be fair, but if you feel your grade doesn't reflect your work, you can always discuss it with your instructor.</li>
          <li className="mb-2">As an experimental system, REGAI is continuously improving based on feedback and results.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Role in Improving REGAI</h2>
        <p className="mb-4">As users of this experimental system, your feedback is invaluable. We encourage you to:</p>
        <ul className="list-disc list-inside mb-4">
          <li className="mb-2">Provide feedback on the grading process and results.</li>
          <li className="mb-2">Report any inconsistencies or issues you notice.</li>
          <li className="mb-2">Suggest improvements or features you'd like to see.</li>
        </ul>
        <p>Your input will help us refine and enhance REGAI, making it more accurate and helpful for future use.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Questions or Concerns?</h2>
        <p>If you have any questions about REGAI or how it's being used in your course, please don't hesitate to reach out to your instructor or the support team. We're here to ensure that this experimental system supports your learning effectively.</p>
      </section>
    </div>
  );
};

export default HowItWorks;