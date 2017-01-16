from icharger.comms_layer import ChargerCommsManager
import sys, traceback

ret_code = 0
MAX_COUNT = 500


def main_direct():
    count = 0
    comms = None
    beep_enabled = False

    while count < MAX_COUNT:
        try:
            print("Count: {0}".format(count))
            if not comms:
                comms = ChargerCommsManager(master=None)
            comms.get_channel_status(0)

            prior = comms.get_system_storage()

            # print(json.dumps(info.to_primitive(), indent=2))
            comms.set_beep_properties(beep_index=0, enabled=beep_enabled, volume=4)
            beep_enabled = not beep_enabled

            after = comms.get_system_storage()
            assert prior.beep_enabled_key != after.beep_enabled_key

            count += 1

        except Exception, e:
            print("whoa...", e)

            traceback.print_exc(file=sys.stderr)

            comms.reset()

            # ret_code = 5

            # break

    del comms




sys.exit(ret_code)