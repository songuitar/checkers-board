# ChessBoard

## Development server

Make sure you have node.js and npm installed in your system

Installation: run `npm install`

Run `npm start-reader` to start board backend (file reader). Will be available at `http://localhost:3000`.

Run `npm start` to start board frontend. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

if there's something wrong with backend, and you suddenly get 500 error 
- make sure you have correct json in your file and then reload the page in browser

Edit matrix in `boardState.js` to change board state:

1 - is "black"
2 - is "white"
10 - is "white king"
20 - is "black king"
