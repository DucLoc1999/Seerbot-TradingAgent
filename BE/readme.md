# SeerBOT - Backend

Welcome to the backend of the SeerBOT project! This FastAPI application serves as the backend for our innovative platform, providing various APIs and functionalities to support our frontend and other services.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- RESTful API endpoints for various functionalities
- User authentication and session management
- CORS support for cross-origin requests
- Static file serving for public assets
- Basic authentication for API documentation access
- Middleware for caching and session management

## Technologies

- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used for building the API
- [Uvicorn](https://www.uvicorn.org/) - ASGI server for running the FastAPI application
- [Starlette](https://www.starlette.io/) - The underlying framework for FastAPI
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation and settings management
- [Python](https://www.python.org/) - Programming language used (Python 3.7+ recommended)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/Cardano_hack_2025.git
   cd Cardano_hack_2025/BE
   ```

2. Create a virtual environment (optional but recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Before running the application, you need to configure the settings. Create a `.env` file in the root of the project and add the following variables:

```env
PROJECT_NAME="SeerBOT"
VERSION="1.0.0"
SESSION_SECRET_KEY="your_secret_key"
DOC_PASSWORD="your_documentation_password"
STATIC_FOLDER="path_to_static_files"
PORT=8000
```

Make sure to replace the placeholder values with your actual configuration.

## Running the Application

To run the FastAPI application, use the following command:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The application will be accessible at `http://127.0.0.1:8000`.

## API Documentation

The API documentation can be accessed at:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

You will need to provide the correct password to access the documentation.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Thank you for your interest in the SeerBOT project! We hope you find it useful and inspiring.
```

Feel free to modify any sections to better fit your project's specifics, such as the installation instructions, configuration details, or any additional features you may want to highlight.