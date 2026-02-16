import Header from './components/Header';
import NightScene from './components/NightScene';
import TimeFilter from './components/TimeFilter';
import TaskSection from './components/TaskSection';
import Footer from './components/Footer';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ paddingTop: '165px' }} />
      <NightScene />
      <div style={{ backgroundColor: '#2e2e2e', flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '70px' }}>
        <TimeFilter />
        <TaskSection />
      </div>
      <Footer />
    </div>
  );
}

export default App;
