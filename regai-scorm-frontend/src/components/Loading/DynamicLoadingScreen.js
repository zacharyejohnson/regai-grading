// import React, { useState, useEffect } from 'react';
//
// function DynamicLoadingScreen({ processId }) {
//   const [messages, setMessages] = useState([]);
//
//   useEffect(() => {
//     const socket = new WebSocket(`ws://localhost:8000/ws/process/${processId}/`);
//
//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setMessages(prevMessages => [...prevMessages, data.message]);
//     };
//
//     return () => {
//       socket.close();
//     };
//   }, [processId]);
//
//   return (
//     <div className="loading-screen">
//       <h2>Processing...</h2>
//       {messages.map((message, index) => (
//         <p key={index}>{message}</p>
//       ))}
//     </div>
//   );
// }
//
// export default DynamicLoadingScreen;