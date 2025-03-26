import {makeOracleInstanceV2} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV2(),
		history: await fetchAsText("/history/cycle-2.txt")
	}
}