/* eslint-disable @typescript-eslint/no-empty-function */
import React from "react";
import {Provider} from "react-redux";
import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import MainLayout from "./layouts/mainLayout/mainLayout";
import {store} from "./services/redux/store";

function App() {
  // const disableConsoleLogs = process.env.NODE_ENV === "production";
  const disableConsoleLogs = false;
  if (disableConsoleLogs) {
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    console.debug = () => {};
  }

  return (
    <div className="App">
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
