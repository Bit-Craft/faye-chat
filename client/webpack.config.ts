import * as webpack from "webpack";
import * as path from "path";
import * as HtmlWebpackPlugin from "html-webpack-plugin";

const config: webpack.Configuration = {
	mode: "production",

	entry: [
		"./src/index.tsx",
		"./src/style.less"
	],
	output: {
		path: path.join(__dirname, "dist"),
		filename: "bundle.js"
	},

	devtool: "source-map",

	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".less"]
	},

	plugins: [
		new webpack.NamedModulesPlugin(),
		new HtmlWebpackPlugin({
			title: "Jostein Thorsen | Faye",
			chunksSortMode: "dependency",
			template: path.resolve(__dirname, "./src/index.ejs")
		})
	],

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loaders: [
					"awesome-typescript-loader"
				],
				exclude: path.resolve(__dirname, "node_modules"),
				include: path.resolve(__dirname, "src")
			},
			{
				enforce: "pre",
				test: /\.js$/,
				loader: "source-map-loader"
			},
			{
				test: /\.less$/,
				loaders: [
					"style-loader",
					"css-loader",
					"less-loader"
				]
			},
		]
	}
};

export default config;
