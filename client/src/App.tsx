import 'antd/dist/antd.css'
import { AccountGuard } from './components/AccountGuard'
import { Account } from './contexts/AccountContext'
import './App.css'

function App() {
  return (
    <Account>
      <AccountGuard />
    </Account>
  )
}

export default App
