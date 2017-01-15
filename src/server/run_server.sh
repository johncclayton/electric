#!/usr/bin/env bash
export PYTHONPATH=.

# Recommend running ./run_server.sh --debug
for i in "$@" ; do
    if [[ $i == "--unicorns" ]] ; then
        # rest_interface will thus create a ChargerCommsManager using a multiprocess.Lock()
        # In *theory* this should work well / fast. In practice with current USB it falls over and the client
        # can't get anything sensible from the server at all.
        #
        # --preload, loads the code so it can be shared between workers.
        # It is *required* in order to share the multiprocess.Lock() between workers.
        # But: as a result, --reload doesn't work.
        #
        # So, using "watchdog" sort of works. Not quite as reliably, not sure why (might be to do with the 'auto-restart'
        # rather than 'shell-command' I'm using).

        # So watch all files, kill existing, and kick off another
        echo "Starting with many preloaded, multiprocess unicorns..."
        DIR=`pwd`
        watchmedo auto-restart -p "*.py;*.html;*.css;*.js" --recursive './start_gunicorn.sh'
        exit
    fi
done

# This is the default for now, the most reliable
# Note: if DEBUG_MODE is set, rest_interface will create a ChargerCommsManager without locking
# which is fine, since Flask does single threaded access.
echo "Starting in DEBUG mode using flask, zero unicorns and no RQ"
export DEBUG_MODE=1
python electric/main.py


# If you want to run RQ, that's doable...
# The code is commented out.
# See: rest_interface constructor



