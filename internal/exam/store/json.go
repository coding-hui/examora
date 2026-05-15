package store

import (
	"encoding/json"

	"gorm.io/datatypes"

	"github.com/coding-hui/examora/internal/exam"
)

func jsonToMap(data datatypes.JSON) map[string]any {
	if len(data) == 0 {
		return nil
	}
	var out map[string]any
	_ = json.Unmarshal(data, &out)
	return out
}

func mapToJSON(data map[string]any) datatypes.JSON {
	if data == nil {
		return datatypes.JSON([]byte("{}"))
	}
	raw, _ := json.Marshal(data)
	return datatypes.JSON(raw)
}

func jsonToTestCases(data datatypes.JSON) []exam.TestCase {
	if len(data) == 0 {
		return nil
	}
	var out []exam.TestCase
	_ = json.Unmarshal(data, &out)
	return out
}

func testCasesToJSON(tc []exam.TestCase) datatypes.JSON {
	if tc == nil {
		return datatypes.JSON([]byte("[]"))
	}
	raw, _ := json.Marshal(tc)
	return datatypes.JSON(raw)
}
