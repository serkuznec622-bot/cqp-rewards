[EN](README.md) [RU](README_ru.md)

# Crypto Quest

This repository contains the code for the "Oracle," which is responsible for the fair distribution of in-game rewards, along with a demo application showcasing its functionality.

## Quick Start

The Oracle and demo application are built on Node.js. Below are the steps to deploy the application on a local machine:

1. Install the latest version of Node.js: [https://nodejs.org/en/download](https://nodejs.org/en/download)  
2. Clone or download this repository  
3. Open the terminal and navigate to the root folder of the downloaded repository  
4. Run `npm install` in the terminal to install dependencies  
5. Run `npm run dev` in the terminal to start the application  
6. Open the application at: [http://localhost:3000](http://localhost:3000)  

## Objectives

1. **Transparency**
    - Players should:
      - Be able to review the source code of the reward distribution mechanism  
      - Have access to all rewards from the current and past cycles  
      - Find the blocks they opened and verify that their actions were honestly recorded in the system  
    - Developers should not:
      - Change the total reward amount  
      - Influence how rewards are distributed among players  
      - Know where the prizes are hidden  
2. **Result Reproducibility**
    - Regardless of the device running the mechanism, the results should be deterministic and independent of external influences, given the same sequence of actions.  
3. **Developer Obfuscation**
    - The mechanism must prevent developers from knowing where the prizes are located. Everything should depend solely on player actions. Each subsequent action should randomly change the reward distribution while ensuring reproducibility for identical sequences of actions.  
4. **Guaranteed Reward Allocation**
    - The mechanism should be designed so that if all blocks are opened, all available rewards are distributed, and players should be able to verify this.  
5. **Current Cycle Demonstration**
    - The mechanism should be able to demonstrate the operation of the current cycle, eliminating the possibility of cheating by other players.  
6. **Historical Cycle Analysis**
    - Players should have the ability to review their actions and those of other players in a fair simulation to ensure that their rewards were distributed fairly.  

## Oracle

To achieve these objectives, the Oracle algorithm was developed, following this workflow:

1. The Oracle is explicitly initialized, and all available rewards are loaded into it.  
2. A hash is initialized using a starting seed, which ensures randomness in reward distribution.  
3. The player clicks on any block.  
4. The mechanism updates the hash by appending `dig <block-index>` or `open <block-index>`, depending on the player's action.  
5. The updated hash is passed to the Oracle to calculate the reward.  
6. The calculated reward is granted to the player.  
7. The process returns to step 3.  

> As seen in this workflow, each player action modifies the hash, which determines the next reward. Thus, even on the same Oracle, different field-opening sequences lead to different results.  

### Internal Structure

The Oracle's code is located within the downloaded application in the `libs/oracle/src` folder.  

- `libs/oracle/src/oracle-instance.js` contains the prizes loaded into the Oracle.  
- `libs/oracle/src/oracle-utils.js` includes hash modification functions and Oracle queries for reward retrieval.  
- `libs/oracle/src/core/oracle.js` contains the Oracle's implementation.  
- `libs/oracle/src/core/seed.js` handles hash generation and random number generation based on the hash.  
- `libs/oracle/src/test` contains functions for testing the Oracle and the random number generation mechanism, ensuring result reproducibility and Oracle functionality.  
- `public/history` stores the history of opened fields for the current and past cycles, allowing players to verify the algorithm's fairness.  

> Importantly, we do not store the current cycle's seed in the history to prevent cheating attempts.  

## Demo Application

The demo application allows players to open a simulation of the current cycle to verify that all rewards indeed exist on the field and to confirm the fairness and reproducibility of the results.  

One way to verify the consistency between the demo application and the real game is to take a screenshot of a chosen field and compare the results in the demo after the cycle ends. Players can also check all uncovered super prizes and prizes that were left unclaimed in that cycle.  

> We do not disclose player data associated with block openings to maintain user anonymity.  

### Internal Structure

- `src/controllers/field-controller.js` handles communication between the demo application and the Oracle, tracking opened fields, requesting new rewards, and implementing UI event handling.  
- `src/cycles` contains all initialization data for the Oracle for the current and past cycles.  

## The Crypto Quest team is always open to suggestions and sincerely wishes you good luck!  
