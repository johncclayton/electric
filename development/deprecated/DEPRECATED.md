# Old Stuff

We used to do some of this.
Put here so it's not in the main DEVELOPMENT.md file.
Might be useful? Maybe not.

# Publishing a package

## Publishing the electric project the PyPi way

Here's the steps - assuming you already have a virtualenv or some Python 2.7 environment ready to go.  You will be
building the package and distributing it to the live PyPi repository. 

    $ sudo apt-get install gcc python-dev cython
    $ pip install twine
    $ cd $HOME
    $ git clone https://github.com/johncclayton/electric.git
    $ cd electric/src/server
 
  
### Configure publish access to the PyPi repo

    $ cp pypirc_template ~/.pypirc
    $ <edit the file in your home directory to reflect your account details / pwd>
  
### Steps to publish to PyPi  

#### Prepare setup.py and decide on a version
PyPi doesn't allow overwrites. You cannot publish 1.0.0 and then re-publish 1.0.0. If you want to publish, you need to do so to a new version number.  Check the current
PyPi repo for the current version first and then increment based on your change.

The distribute.py script uses the current requirements files and configuration to regenerate a suitable setup.py
which is then run for you.  Twine is assumed as the upload tool; so this must be installed first - which of
course you have already installed, because you absolutely, definately followed the instructions above.  'Course you did! 

The PyPi repo being published to is: https://pypi.python.org/pypi/electric/

Assuming you want to publish to version 0.7.5 - do this:

    $ cd electric/src/server
    $ python scripts/distribute -v 0.7.5 -p
    
Done.  Now anyone can simply run this to install electric:

    $ (sudo) pip install electric 
    
If you are upgrading an existing installation, do the same but add '--upgrade':
    
    $ (sudo) pip install electric --upgrade

# Servers (old old old)
## How to run the servers 
When you install electric via PyPi, there are two commands available after installation.

electric-server: this is the web service
electric-worker: this is the zeromq based worker that connects to the charger

You can start them in any order; by default electric-worker listens on 127.0.0.1:5001 for 
instructions.  You can change this by setting environment variables; one for the server to use for its outgoing
connection; one for the worker to use when it binds to its interface.


| Environment Variable | Default Value | Where |
| ---------------------| :------------ | ------
| **ELECTRIC_WORKER** | tcp://127.0.0.1:5001 | electric-server  

Note that on the worker the default is to listen on all interfaces.  

