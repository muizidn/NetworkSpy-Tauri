// import { useState } from "react";
// import reactLogo from "../assets/react.svg";
// import { invoke } from "@tauri-apps/api/tauri";
// import Welcome from "../packages/welcome/Welcome";
// export default function Home() {
//   const [greetMsg, setGreetMsg] = useState("");
//   const [name, setName] = useState("");

import { BottomPane } from "../packages/bottom-pane/BottomPane";
import { FilterBar } from "../packages/filter-bar/FilterBar";
import { Header } from "../packages/header/Header";
import { MainContent } from "../packages/main-content/MainContent";
import { LeftSidebar } from "../packages/sidebar/LeftSidebar";
import { RightSidebar } from "../packages/sidebar/RightSidebar";

//   async function greet() {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     setGreetMsg(await invoke("greet", { name }));
//   }

//   return (
//     <div className="flex flex-row h-full w-full m-10">
//       <div>
//         <div className="flex flex-col">
//           <Welcome />

//           <form
//             className="flex flex-row pt-5 gap-2"
//             onSubmit={(e) => {
//               e.preventDefault();
//               greet();
//             }}
//           >
//             <input
//               id="greet-input"
//               onChange={(e) => setName(e.currentTarget.value)}
//               placeholder="Enter a name..."
//             />
//             <button type="submit">Greet</button>
//           </form>

//           <p>{greetMsg}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

const App = () => (
  <div className="flex flex-col h-screen">
    <Header />
    <div className="flex flex-grow overflow-hidden">
      <LeftSidebar />
      <div className="flex flex-col">
        <FilterBar />
        <MainContent />
        <BottomPane />
      </div>
      <RightSidebar />
    </div>
  </div>
);

export default App;
