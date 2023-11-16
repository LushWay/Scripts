# Shp1nat Mine Server Script

Script API pack for Minecraft PE anarchy server called Shp1natMine. 

This project uses many code from:
  [Bedrock Scripting API](https://discord.gg/wMSBmuBB)
  [Herobrine's Chest UI](https://github.com/Herobrine643928/Chest-UI/)
  [Smelly API](https://github.com/Smelly-API/Smelly-API)
  [Rubedo](https://github.com/smell-of-curry/rubedo)

## Folder overview

### tools

Scripts used to help in development

### scripts

#### lib
**Class / Command / Database / Form / Lang / List**

Классы, функции, утилиты и листы не зависящие от загрузки

**Setup** - Тут происходит сама загрузка



#### modules
**Development** - Разработка

**Gameplay** - Выживание, строительство, миниигры и их общий код

**Server** - Общеиспользуемые системы для модерирования и украшения игры не зависящие от типа сервера


#### Rename branch

```bash
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
git push --set-upstream origin main
```