var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: "./src/clientStartup.tsx",
    output: {
        filename: "./dist/bundle.js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
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