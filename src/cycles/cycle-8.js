import {makeOracleInstanceV8} from "../../libs/oracle/src/oracle-instance";
import {fetchAsText} from "@/utils";

export async function get() {
	return {
		oracle: makeOracleInstanceV8(),
		history: await fetchAsText("/history/cycle-8.txt")
	}
}