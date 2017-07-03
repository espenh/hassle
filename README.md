# Hassle
TypeScript playground with in-editor type generation for Swagger-enabled endpoints.

![alt tag](https://github.com/espenh/hassle/blob/master/docs/screenshots/hassle_fireworks.gif)

![alt tag](https://github.com/espenh/hassle/blob/master/docs/screenshots/hassle_water.png)

## Examples
[https://hassle.azurewebsites.net/#husky](https://hassle.azurewebsites.net/#husky)

[https://hassle.azurewebsites.net/#fireworks (click the square)](https://hassle.azurewebsites.net/#fireworks)

[https://hassle.azurewebsites.net/#water](https://hassle.azurewebsites.net/#water)

[https://hassle.azurewebsites.net/#minecraft](https://hassle.azurewebsites.net/#minecraft)

## Sample
```javascript
const response = await fetch("http://petstore.swagger.io/v2/store/inventory");
const inventory = await response.json();
// By parsing the swagger metadata, types have been injected into the editor model,
// and 'inventory' is of type 'string[]', not 'any' as it would normally be.
```
```TODO - Add animation demonstrating intellisense in vscode.```

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