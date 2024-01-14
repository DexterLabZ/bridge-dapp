/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import { Provider } from "react-redux";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import MainLayout from "./layouts/mainLayout/mainLayout";
import { store } from "./services/redux/store";
import { Helmet } from "react-helmet";

function App() {
  // const disableConsoleLogs = process.env.REACT_APP_NETWORK_ENV === "production";
  const disableConsoleLogs = false;
  if (disableConsoleLogs) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.debug = () => {};
  }

  return (
    <div className="App">
      {process.env.REACT_APP_NETWORK_ENV == "production" ? (
        <></>
      ) : (
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
      )}

      <Router>
        <Provider store={store}>
          <Routes>
            <Route path="" element={<MainLayout />} />
          </Routes>
        </Provider>
      </Router>
    </div>
  );
}

export default App;
