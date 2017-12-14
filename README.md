# loopback-cli

LoopBack CLI tool for creating projects, models and more.
This package supersedes the older `slc` tool.

## Installation

To install the LoopBack CLI tool:

```
$ npm install -g loopback-cli
```

## Use

### Getting started

 1. Run `lb [appName]` to create a new LoopBack application.
 2. Run `node .` to start the scaffolded server.

### What's next

Run `lb -l` to list all available commands:

```
$ lb -l
Available commands:
  lb acl
  lb app
  lb boot-script
  lb bluemix
  lb datasource
  lb export-api-def
  lb middleware
  lb model
  lb property
  lb relation
  lb remote-method
  lb soap
  lb swagger
  lb zosconnectee
```

Run `lb <command> --help` to learn more about each command. For example:

```
$ lb model --help
Usage:
  lb model [options] [<name>]

Options:
  -h,   --help          # Print the generator's options and usage
        --skip-cache    # Do not remember prompt answers             Default: false
        --skip-install  # Do not automatically install dependencies  Default: false

Arguments:
  name  # Name of the model to create.  Type: String  Required: false

Description:
  Creates a new Model in the LoopBack application.

Example:

  lb model Product

  This adds an entry to `Product.json` defining the model "Product".
```

Refer to [Create a simple API](http://loopback.io/doc/en/lb3/Create-a-simple-API.html) 
for more information.

Refer to [README_Soap](./soap/README_Soap.md) for more information on 'lb soap' command.
## Contributing

IBM/StrongLoop is an active supporter of open source and welcomes contributions
to our projects as well as those of the Node.js community in general. For more
information on how to contribute please refer to the
[Contribution Guide](CONTRIBUTING.md).

## Mailing List

Discuss features and ask questions on
[LoopBack Forum](https://groups.google.com/forum/#!forum/loopbackjs).

## License

MIT
