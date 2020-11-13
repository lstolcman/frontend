import React from 'react'
import { Typography, Box } from '@material-ui/core'
import Table from './Table'
import Pagination from './Pagination'
import Actions from './Actions'
import Loader from './Loader'
import OpenInNewCard from './OpenInNewCard'
import useLanguage from '../utils/useLanguage'


const Logs = ({
  logs,
  user,
  loading,
  error,
  page,
  setPage,
  rowsInTotal,
  rowsPerPage,
  setDetails,
}) => {
  const { translations } = useLanguage()
  return loading
    ? <Loader dark big />
    : error
      ? <Typography color='error'>{translations.connectionProblem.logs}</Typography>
      : <>
        <Table
          data={logs.map(item => ({
            timestamp: item._source.timestamp,
            location: <>
              <OpenInNewCard path={`/location/${item._source.doc_id}`}>{item._source.name}</OpenInNewCard>
              <Typography variant='caption' component='div'>
                {item._source.changes.action && item._source.changes.action === 'created'
                  ? 'Nowa lokacja'
                  : Object.keys(item._source.changes).join(', ')
                }
              </Typography>
            </>,
            user: <Box whiteSpace='nowrap'>{
              item._source.modified_by === user.sub ? 'Ja' : item._source.modified_by}
            </Box>,
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
            { name: 'Lokacja i edytowane pola', field: 'location' },
            { name: 'Autor zmiany', field: 'user' },
            { name: '', field: 'actions' },
          ]}
        />
        {rowsInTotal > rowsPerPage &&
          <Pagination
            count={rowsInTotal}
            rowsPerPage={rowsPerPage}
            page={page}
            callback={newPage => setPage(newPage)}
          />
        }
      </>
}

export default Logs
