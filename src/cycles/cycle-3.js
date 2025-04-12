import {makeOracleInstanceV3} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV3(),
		history: await fetchAsText("/history/cycle-3.txt")
	}
}