import FloatingTextBar from "./componants/floatingTextBar";
import MainLayout from "./componants/mainLayout";


function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 flex items-center justify-center">
      
      <MainLayout/>
      <FloatingTextBar />
    </div>
  );
}

export default App;
