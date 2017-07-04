# Hassle
TypeScript playground with in-editor type generation for Swagger-enabled endpoints.

![alt tag](https://github.com/espenh/hassle/blob/master/docs/screenshots/hassle_fireworks.gif)

![alt tag](https://github.com/espenh/hassle/blob/master/docs/screenshots/hassle_water.png)


## Examples
[https://hassle.azurewebsites.net/#fireworks](https://hassle.azurewebsites.net/#fireworks)

[https://hassle.azurewebsites.net/#water](https://hassle.azurewebsites.net/#water)

[https://hassle.azurewebsites.net/#husky](https://hassle.azurewebsites.net/#husky)

[https://hassle.azurewebsites.net/#minecraft](https://hassle.azurewebsites.net/#minecraft)


## Type generation
![alt tag](https://github.com/espenh/hassle/blob/master/docs/screenshots/hassle_swagger_typegen.png)

Note how the standard ```fetch()``` and ```json()``` methods now return a typed object, enabling code completion and tooltips for previously unknown response types. This is done by resolving the swagger json schema and generating TypeScript type information for matching url. The trick is describing an overload for ```fetch()``` with a string literal type that is the matching url, and then having the overloaded return type use a typed response for the```json()``` method. 

This could probably be taken further and used to enable typed parameters for POST requests, or different return types for different response codes etc.


## How to run
Initial setup:
```
git clone https://github.com/espenh/hassle.git
cd hassle
npm install
```

### Run development server:
```bash
npm run watch
```
Navigate to http://localhost:4321.


### Build for production:
```
npm run build
```
Build output ends up in the ```dist``` folder.