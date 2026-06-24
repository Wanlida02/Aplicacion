// netlify/functions/load-checklist.js
const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

exports.handler = async (event, context) => {
  try {
    const res = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?pageSize=100`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
	  "Content-Type": "application/json"
        }
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.error("Airtable error:", txt);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error leyendo de Airtable" })
      };
    }

    const json = await res.json();

    const items = (json.records || []).map(rec => ({
      id_tarjeta: rec.fields.id_tarjeta || rec.fields.Name || "",
      criticidad: rec.fields.criticidad || "",
      notes: rec.fields.notes || ""
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno" })
    };
  }
};