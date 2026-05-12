<template>
  <div class="timeline-sidebar">
    <h4 style="margin-bottom: 15px; color: #303133;">时间线</h4>
    <div v-for="(months, year) in timeline" :key="year" class="timeline-year">
      <div class="timeline-year-header" @click="toggleYear(year)">
        <el-icon v-if="expandedYears.includes(year)"><ArrowDown /></el-icon>
        <el-icon v-else><ArrowRight /></el-icon>
        {{ year }} 年
      </div>
      <div v-show="expandedYears.includes(year)" class="timeline-month">
        <div v-for="(days, month) in months" :key="month" class="timeline-month">
          <div class="timeline-month-header" @click="toggleMonth(`${year}-${month}`)">
            <el-icon v-if="expandedMonths.includes(`${year}-${month}`)"><ArrowDown /></el-icon>
            <el-icon v-else><ArrowRight /></el-icon>
            {{ month }} 月
          </div>
          <div v-show="expandedMonths.includes(`${year}-${month}`)">
            <div 
              v-for="day in days" 
              :key="day.day"
              class="timeline-day"
              @click="selectDate(year, month, day.day)"
            >
              {{ day.day }} 日 ({{ day.count }})
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMediaStore, useAlbumStore } from '../stores'

const mediaStore = useMediaStore()
const albumStore = useAlbumStore()

const expandedYears = ref([])
const expandedMonths = ref([])

const timeline = computed(() => mediaStore.timeline)

const toggleYear = (year) => {
  const index = expandedYears.value.indexOf(year)
  if (index > -1) {
    expandedYears.value.splice(index, 1)
  } else {
    expandedYears.value.push(year)
  }
}

const toggleMonth = (key) => {
  const index = expandedMonths.value.indexOf(key)
  if (index > -1) {
    expandedMonths.value.splice(index, 1)
  } else {
    expandedMonths.value.push(key)
  }
}

const selectDate = (year, month, day) => {
  const startDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const endDate = startDate
  mediaStore.fetchMedia({
    album_id: albumStore.currentAlbum?.id,
    start_date: startDate,
    end_date: endDate
  })
}

watch(() => albumStore.currentAlbum, () => {
  mediaStore.fetchTimeline({ album_id: albumStore.currentAlbum?.id })
}, { immediate: true })
</script>
