import React, { useEffect, useState } from 'react';
import './styles/style.scss';
import { SignIn } from './pages/SignIn/SignIn';
import { Register } from './pages/Register/Register';
import { Loader } from './components/Loader/Loader';
import { Switch, BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import { firebaseService } from './services/index';
import { UserContext } from './contexts/UserContext';
import { Home } from './pages/Home/Home';
import { Day } from './pages/Day/Day';
import { Tasks } from './pages/Tasks/Tasks';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    firebaseService.initialize((user) => {
      setUser(user);
      setIsLoading(false);
    }, () => {
      setUser(null);
      setIsLoading(false);
    });
  }, []);

  return (
    !isLoading ?
      (
        <UserContext.Provider value={{user, setUser}}>
          <Router>
            <Switch>
              <Route path="/login" component={SignIn} />
              <Route path="/register" component={Register} />
              {!user ? <Redirect to="/login" /> : <Route path="/date/:year/:month/:day" component={Day} />}
              {!user ? <Redirect to="/login" /> : <Route path="/tasks" component={Tasks} />}
              {!user ? <Redirect to="/login" /> : <Route exact path="/" component={Home} />}
            </Switch>
          </Router>
        </UserContext.Provider>
      )
      : <Loader />);
}

export default App;
