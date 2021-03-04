import { AccountGuard } from './components/AccountGuard'
import { Account } from './contexts/Account'
import './App.less'

function App() {
  return (
    <Account>
      <AccountGuard />
    </Account>
  )
}

export default App
