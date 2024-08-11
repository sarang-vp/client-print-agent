# client-print-agent

Client Print Agent is a Node.js application designed to handle printing tasks from the client side. It can interact with thermal printers(ESC/POS), PDF printers, and more. This application can be installed as a Windows service, ensuring it runs in the background and starts automatically with your system.

# Client Print Agent

A Node.js application for printing PDFs and thermal receipts with various printer setups and configurations.

## Features

- List available printers.
- Print PDFs to a specified printer.
- Print receipts with thermal printers.

## Prerequisites

- Node.js installed on your machine.
- Printers set up on your system.
- npm (Node Package Manager) to install dependencies.
- thermal printer which support ESC/POS command

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sarang-vp/client-print-agent.git
   cd client-print-agent
   ```

## Usage

- Listing Available Printers

You can retrieve a list of all printers installed on the system by making a GET request to /printers endpoint.

- Printing a PDF
  To print a PDF file, send a POST request to the /print endpoint with the PDF file and the printer name.

- Thermal Printing
  To print a receipt or other content on a thermal printer, send a POST request to the /thermalPrint endpoint with the necessary data.

- Example Endpoints

List Printers: GET /printers
Print PDF: POST /print
Thermal Print: POST /thermalPrint
Uninstallation
To uninstall the service, run the following script: node uninstall-service.js
