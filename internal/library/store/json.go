package store

import (
	"encoding/json"

	"gorm.io/datatypes"
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
