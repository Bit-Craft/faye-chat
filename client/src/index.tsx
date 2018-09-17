import * as React from "react";
import * as ReactDOM from "react-dom";

import FayeClient from "./FayeClient";

const root = document.getElementById("root");
ReactDOM.render(<FayeClient serverAddress="/bayeux"/>, root);