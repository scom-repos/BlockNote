# Setup and Installation for Local Testing

To get started with testing locally, follow these steps:

#### 1: Install the required packages using the following command:

```sh
docker-compose up install
```

#### 2: Build and bundle the library using the following command:

```sh
docker-compose up build
```

which will create a `release` folder in the root directory used for the other repositories.

#### 3. Run a development server using the following command:

```sh
docker-compose up installTest
docker-compose up test
```

You can access the development server via http://127.0.0.1:5173/.
