import React from 'react'
import { Typography, Box } from '@material-ui/core'
import Table from './Table'
import Actions from './Actions'
import Loader from './Loader'
import OpenInNewCard from './OpenInNewCard'
import useLanguage from '../utils/useLanguage'
import { formatDate } from '../utils/helpers'


const Reports = ({
  reports,
  loading,
  error,
  setDetails,
}) => {
  const { translations } = useLanguage()
  return loading
    ? <Loader dark big />
    : error
      ? <Typography color='error'>{translations.connectionProblem.logs}</Typography>
      : <>
        <Table
          data={reports.map(item => ({
            timestamp: formatDate(item.last_modified_timestamp),
            location: <OpenInNewCard path={`/location/${item.id}`}>{item.name}</OpenInNewCard>,
            report_reason: item.report_reason.map(item =>
              <Typography variant='caption'>{item}</Typography>
            ),
            actions: <Actions
              primary={[
                {
                  label: translations.details,
                  action: () => setDetails({ id: item._id, ...item._source }),
                },
              ]}
            />,
          }))}
          labels={[
            { name: 'Data', field: 'timestamp' },
            { name: 'Lokacja', field: 'location' },
            { name: 'Treść zgłoszeń', field: 'report_reason' },
            { name: '', field: 'actions' },
          ]}
        />
      </>
}

export default Reports
