var path = require("path");
var CopyWebpackPlugin = require('copy-webpack-plugin');

var outputPath = path.join(__dirname, "dist");

module.exports = {
    entry: "./src/clientStartup.tsx",
    output: {
        filename: "bundle.js",
        path: outputPath
    },
    devtool: process.env.NODE_ENV === "production" ? undefined : "source-map",
    devServer: {
        contentBase: outputPath,
        host: "0.0.0.0",
        port: 4321
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                use: ['source-map-loader']
            },
            {
                test: /\.tsx?$/,
                use: ["ts-loader"]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: 'node_modules/monaco-editor/min/vs',
                to: './dist/vs'
            },
            // We want monaco-editor to use a newer version of typescript.
            {
                from: 'typescript_update',
                to: './dist/vs/language/typescript',
                force: true
            }
        ])
    ]/*,
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    }*/
};