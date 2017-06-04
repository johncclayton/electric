#Charger Operations

##Goals:

- **Charger is master**: always reflect what the charger is doing. Regardless what is going on, if a user performs an action on the charger, this should override / be reflected on the UI.
- **Alarms**
  - We want to sound an alarm when charging (discharge, store, balance) completes.
  - This should happen regardless if the user started the operation on the charger, or if it was done via the UI.
- **Reslient operations**: The UI should try to reach a state with some ... persistence.  Main example is the 'stop' operation, which has at least 2 parts.  'Stop' should be performed until the charger enters the 'not doing anything at all' state.
- **Auto Stop**: When doing balance, charge, discharge or store, we want to automatically sound an alarm when the operation is complete. 
  - State 40 means 'done'
  - Find previous state, and notify an alarm for that state 

##Conclusions
- The charger must monitor **charger state** and bring the UI to match that status, regardless of current operation. Existing operations can be cancelled (or in fact, started) based on the status of the unit.
- Async operations (like stop) are performed periodically, where success is based not so much on a return value from the 'stop call', but on the current charger state.
- To sound alarms, the UI will need to monitor state, so that it knows what the last active operation is (per channel). It can then sound an alarm for that operation, when it sees a '40'


##Architecture
- The charger UI is dictated by the charger state.
- Commands "do stuff" on the charger.  State changes on the UI happen as a result of the UI constantly monitoring state.
  - we may change UI state immediately, pre-empting the change on the charger, but this is an optimization for later.
  
##TODO
- Make sure the UI can show charger state.
- If it's in the middle of an operation, who cares. Just update state.
  
